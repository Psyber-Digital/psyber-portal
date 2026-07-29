// Client-activity stamping for the completion machinery (ADR-0020 / ADR-0021).
//
// The admin "Quiet for N days" flag reads profiles.last_activity_at. Until this
// existed, that column was written in exactly one place — the coach's "I heard
// back from them" button — so the flag measured *coach bookkeeping* rather than
// client behaviour. A client working steadily through the portal while the coach
// was heads-down would still trip the ten-day flag, and under ADR-0021 that flag
// is the only backstop against a client going quiet unnoticed.
//
// Server-only: profiles are admin-write-only under RLS (see 0002_rls.sql), so
// this needs the service-role client and must never reach a client component.
//
// Two deliberate properties:
//   · Throttled — one write an hour at most. Page views are frequent and the
//     flag has a ten-day resolution, so per-request writes buy nothing.
//   · Silent — bookkeeping never breaks a page. All failures are swallowed.

import { createAdminClient } from "@/lib/supabase/admin";

const THROTTLE_MS = 60 * 60 * 1000;

export async function touchActivity(
  userId: string,
  role: string | null | undefined,
  lastActivityAt?: string | null,
): Promise<void> {
  // Only clients. An admin opening a page is not a sign of client movement.
  if (role !== "client") return;

  if (lastActivityAt) {
    const age = Date.now() - new Date(lastActivityAt).getTime();
    if (Number.isFinite(age) && age < THROTTLE_MS) return;
  }

  try {
    await createAdminClient()
      .from("profiles")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", userId);
  } catch {
    // Deliberately silent.
  }
}
