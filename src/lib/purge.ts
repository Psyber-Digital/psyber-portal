// Shared Files — expiry purge.
//
// IMPORTANT: this is NOT the access control. An expired row is already invisible
// to the client because the RLS SELECT policy in migration 0004 tests
// `expires_at > now()`. This job exists to remove the BYTES — data minimisation.
// If it never runs, nothing leaks; files simply linger in storage.
//
// Runs hourly from a Vercel cron, and lazily whenever the admin dashboard loads
// so it self-heals if the cron is ever misconfigured.

import { createAdminClient } from "@/lib/supabase/admin";
import { SHARED_BUCKET } from "@/lib/shared";

export type PurgeResult = {
  dryRun: boolean;
  matched: number;
  objectsRemoved: number;
  rowsDeleted: number;
  // Only populated on a dry run — so a first run can be inspected before
  // anything irreversible happens.
  wouldDelete?: { id: string; path: string; expired: string | null }[];
  error?: string;
};

// Storage removals are batched; the API takes an array of paths per call.
const BATCH = 100;

export async function purgeExpiredSharedFiles(
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<PurgeResult> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Scoped three ways, deliberately. `direction = 'to_client'` and the explicit
  // NOT NULL are belt-and-braces: a to_coach upload always has a null expiry and
  // must never be swept, no matter what.
  const { data: rows, error } = await admin
    .from("shared_files")
    .select("id, storage_path, direction, expires_at")
    .eq("direction", "to_client")
    .not("expires_at", "is", null)
    .lt("expires_at", now);

  if (error) {
    return { dryRun, matched: 0, objectsRemoved: 0, rowsDeleted: 0, error: error.message };
  }

  const expired = rows ?? [];
  if (!expired.length) {
    return { dryRun, matched: 0, objectsRemoved: 0, rowsDeleted: 0, ...(dryRun ? { wouldDelete: [] } : {}) };
  }

  if (dryRun) {
    return {
      dryRun: true,
      matched: expired.length,
      objectsRemoved: 0,
      rowsDeleted: 0,
      wouldDelete: expired.map((r) => ({
        id: r.id as string,
        path: r.storage_path as string,
        expired: (r.expires_at as string) ?? null,
      })),
    };
  }

  // Objects first, then rows. If a storage removal fails we keep the row so the
  // next run retries it — the alternative (row gone, bytes orphaned) leaves
  // nothing pointing at the file that could ever clean it up.
  const paths = expired.map((r) => r.storage_path as string);
  let objectsRemoved = 0;
  const removedPaths = new Set<string>();

  for (let i = 0; i < paths.length; i += BATCH) {
    const slice = paths.slice(i, i + BATCH);
    const { error: rmErr } = await admin.storage.from(SHARED_BUCKET).remove(slice);
    if (rmErr) {
      console.error("shared-files purge: storage remove failed", rmErr.message);
      continue;
    }
    slice.forEach((p) => removedPaths.add(p));
    objectsRemoved += slice.length;
  }

  const deletableIds = expired
    .filter((r) => removedPaths.has(r.storage_path as string))
    .map((r) => r.id as string);

  let rowsDeleted = 0;
  if (deletableIds.length) {
    const { error: delErr } = await admin
      .from("shared_files")
      .delete()
      .in("id", deletableIds);
    if (delErr) {
      console.error("shared-files purge: row delete failed", delErr.message);
      return {
        dryRun: false,
        matched: expired.length,
        objectsRemoved,
        rowsDeleted: 0,
        error: delErr.message,
      };
    }
    rowsDeleted = deletableIds.length;
  }

  return { dryRun: false, matched: expired.length, objectsRemoved, rowsDeleted };
}
