"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendClientUploadEmail } from "@/lib/email";
import {
  MAX_CLIENT_UPLOADS,
  MAX_UPLOAD_BYTES,
  SHARED_BUCKET,
  formatBytes,
  resolveMime,
  safeObjectName,
  safeTitle,
} from "@/lib/shared";

// Client-side of Shared Files. Note the split of responsibilities throughout:
// the bytes are written with the service role (the bucket has no storage
// policies, so nothing else can write them), but every DATABASE row is written
// with the USER-SCOPED client, so the RLS policies in migration 0004 are the
// real gate. A bug in this file cannot grant a client more than RLS allows.

async function requireClient() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  return { supabase, user, profile };
}

export type UploadResult = { error?: string; ok?: boolean };

export async function uploadToCoach(formData: FormData): Promise<UploadResult> {
  const { supabase, user, profile } = await requireClient();

  const file = formData.get("file") as File | null;
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);

  if (!file || !file.size) return { error: "Choose a file to send." };
  if (file.size > MAX_UPLOAD_BYTES)
    return { error: `That file is ${formatBytes(file.size)} — the limit is 25 MB.` };

  // Resolved rather than trusted: a photo straight off an iPhone often arrives
  // with no declared type at all, and would otherwise be rejected by the bucket.
  const mime = resolveMime(file.type, file.name);
  if (!mime)
    return {
      error: `That file type isn’t accepted. Send a PDF, a Word document, or a photo.`,
    };

  // A courtesy cap, not a security boundary — the bucket's own size limit is.
  // Counted through the user-scoped client, so it only ever sees their own rows.
  const { count } = await supabase
    .from("shared_files")
    .select("id", { count: "exact", head: true })
    .eq("direction", "to_coach");
  if ((count ?? 0) >= MAX_CLIENT_UPLOADS)
    return {
      error: `You have ${MAX_CLIENT_UPLOADS} files waiting already. Remove one before sending another.`,
    };

  const path = `${user.id}/to-coach/${crypto.randomUUID()}-${safeObjectName(file.name)}`;
  const admin = createAdminClient();

  const { error: upErr } = await admin.storage
    .from(SHARED_BUCKET)
    .upload(path, file, { contentType: mime, upsert: false });
  if (upErr) return { error: upErr.message };

  const title = safeTitle(file.name);

  // Inserted as the USER. The RLS insert policy re-checks that this row is
  // theirs, is addressed upward, and carries no expiry.
  const { error: insErr } = await supabase.from("shared_files").insert({
    client_id: user.id,
    direction: "to_coach",
    title,
    note,
    storage_path: path,
    size_bytes: file.size,
    mime_type: mime,
    uploaded_by: user.id,
    expires_at: null,
  });
  if (insErr) {
    await admin.storage.from(SHARED_BUCKET).remove([path]);
    return { error: insErr.message };
  }

  revalidatePath("/portal/shared");
  revalidatePath("/admin");

  // Tell the coach. Best-effort — the upload has already succeeded and must not
  // be undone by a mail failure.
  try {
    await sendClientUploadEmail({
      clientName: profile?.full_name ?? "",
      clientEmail: profile?.email ?? user.email ?? "",
      title,
      note,
    });
  } catch (e) {
    console.error("client-upload notification failed:", e);
  }

  return { ok: true };
}

// A client withdrawing their own upload — wrong file, changed their mind. The
// select and the delete both run as the user, so RLS refuses anything that isn't
// their own 'to_coach' row; only the storage removal needs the service role.
export async function withdrawUpload(id: string): Promise<{ error?: string }> {
  const { supabase } = await requireClient();

  const { data: row } = await supabase
    .from("shared_files")
    .select("id, storage_path, direction")
    .eq("id", id)
    .single();

  if (!row) return { error: "That file is no longer there." };
  if (row.direction !== "to_coach")
    return { error: "You can only remove files you sent." };

  const { error: rmErr } = await createAdminClient()
    .storage.from(SHARED_BUCKET)
    .remove([row.storage_path as string]);
  if (rmErr) return { error: rmErr.message };

  const { error: delErr } = await supabase.from("shared_files").delete().eq("id", id);
  if (delErr) return { error: delErr.message };

  revalidatePath("/portal/shared");
  revalidatePath("/admin");
  return {};
}
