"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCheckInEmail, sendSharedFileEmail, sendWeekUnlockEmail } from "@/lib/email";
import { loadNamedEmail, weekEmail } from "@/lib/weekEmail";
import {
  EXPIRY_WINDOWS,
  MAX_UPLOAD_BYTES,
  SHARED_BUCKET,
  formatBytes,
  resolveMime,
  safeObjectName,
  safeTitle,
} from "@/lib/shared";

// Every action re-verifies admin on the server. RLS is the backstop, but we
// check explicitly so the service-role client is never reached by a non-admin.
async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");
  return { supabase, userId: user.id };
}

export async function addClient(
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const surname = String(formData.get("surname") ?? "").trim();
  const fullName = [firstName, surname].filter(Boolean).join(" ");
  const weekRaw = parseInt(String(formData.get("current_week") ?? "1"), 10);
  const week = Number.isFinite(weekRaw) ? Math.max(0, weekRaw) : 1;

  if (!firstName) return { error: "Enter the client's first name." };
  if (!email) return { error: "Enter the client's email address." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { error: "That doesn't look like a valid email address." };

  const admin = createAdminClient();

  // Create the auth account directly. No email is sent; email_confirm marks the
  // address verified so there's no separate confirmation step. The
  // on_auth_user_created trigger creates the matching profile row.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) {
    const msg = /already|registered|exists/i.test(error.message)
      ? "A client with that email already exists."
      : error.message;
    return { error: msg };
  }

  // Set their name and starting week. Default 1 unlocks Week 01 immediately
  // (a week shows only when published AND number <= current_week).
  await admin
    .from("profiles")
    .update({ full_name: fullName, current_week: week })
    .eq("id", data.user.id);

  revalidatePath("/admin");
  return {};
}

// Permanently removes a client: deletes their auth user, which cascades to their
// profile (FK on delete cascade). Guarded so you can't delete yourself or any
// admin account.
export async function deleteClient(
  clientId: string,
): Promise<{ error?: string }> {
  const { userId } = await requireAdmin();
  if (clientId === userId) return { error: "You can’t delete your own account." };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("id", clientId)
    .single();
  if (target?.role === "admin")
    return { error: "You can’t delete an admin account." };

  // Remove their Shared Files objects BEFORE deleting the user. The FK cascade
  // takes the rows with the auth user, but storage knows nothing about the
  // cascade — without this the bytes would be orphaned and unreachable forever.
  const { data: shared } = await admin
    .from("shared_files")
    .select("storage_path")
    .eq("client_id", clientId);
  if (shared?.length) {
    const { error: rmErr } = await admin.storage
      .from(SHARED_BUCKET)
      .remove(shared.map((f) => f.storage_path as string));
    if (rmErr) {
      // Stop rather than proceed: deleting the user now would strand the files
      // with nothing pointing at them.
      return { error: `Couldn’t remove their files: ${rmErr.message}` };
    }
  }

  const { error } = await admin.auth.admin.deleteUser(clientId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return {};
}

// SHARED FILES ---------------------------------------------------------------

export type SendFileResult = { error?: string; emailed?: boolean; emailError?: string };

// Coach → client. The document expires: the window is picked per item and
// written into expires_at, which the RLS policy enforces on every read.
export async function sendToClient(formData: FormData): Promise<SendFileResult> {
  const { userId } = await requireAdmin();

  const clientId = String(formData.get("client_id") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);
  const file = formData.get("file") as File | null;
  const hours = parseInt(String(formData.get("expiry_hours") ?? ""), 10);

  if (!clientId) return { error: "Pick a client first." };
  if (!file || !file.size) return { error: "Choose a file to send." };
  if (!EXPIRY_WINDOWS.some((w) => w.hours === hours))
    return { error: "Choose how long the file should stay available." };
  if (file.size > MAX_UPLOAD_BYTES)
    return { error: `That file is ${formatBytes(file.size)} — the limit is 25 MB.` };

  // The bucket enforces the type list server-side; resolving it here means a
  // file the browser didn't label (HEIC photos, some .docx) still goes through
  // with the right content type instead of being rejected as octet-stream.
  const mime = resolveMime(file.type, file.name);
  if (!mime)
    return {
      error: `That file type isn’t accepted. Send a PDF, Word or Excel document, or an image.`,
    };

  const admin = createAdminClient();

  const { data: client } = await admin
    .from("profiles")
    .select("email, full_name, role")
    .eq("id", clientId)
    .single();
  if (!client || client.role !== "client") return { error: "That client no longer exists." };

  const path = `${clientId}/to-client/${crypto.randomUUID()}-${safeObjectName(file.name)}`;
  const { error: upErr } = await admin.storage
    .from(SHARED_BUCKET)
    .upload(path, file, { contentType: mime, upsert: false });
  if (upErr) return { error: upErr.message };

  const expiresAt = new Date(Date.now() + hours * 3600_000).toISOString();
  const title = safeTitle(file.name);

  const { error: insErr } = await admin.from("shared_files").insert({
    client_id: clientId,
    direction: "to_client",
    title,
    note,
    storage_path: path,
    size_bytes: file.size,
    mime_type: mime,
    uploaded_by: userId,
    expires_at: expiresAt,
  });
  if (insErr) {
    // Don't leave the bytes behind if the metadata row failed.
    await admin.storage.from(SHARED_BUCKET).remove([path]);
    return { error: insErr.message };
  }

  revalidatePath("/admin");
  revalidatePath("/portal/shared");

  // Always notify — a file that expires in 48 hours and announces itself to
  // nobody is a trap. Best-effort: a mail failure must not undo the send.
  if (!client.email) return { emailError: "No email address on file for this client." };
  try {
    await sendSharedFileEmail({
      to: client.email,
      name: client.full_name,
      title,
      note,
      expiryLabel: EXPIRY_WINDOWS.find((w) => w.hours === hours)!.label,
    });
    return { emailed: true };
  } catch (e) {
    console.error("shared-file email failed:", e);
    return { emailError: e instanceof Error ? e.message : "Unknown error" };
  }
}

// Admin removal, either direction: the coach withdrawing a document early, or
// clearing a client's upload once they've read it.
export async function deleteSharedFile(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("shared_files")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (!row) return {};

  const { error: rmErr } = await admin.storage
    .from(SHARED_BUCKET)
    .remove([row.storage_path as string]);
  if (rmErr) return { error: rmErr.message };

  await admin.from("shared_files").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/portal/shared");
  return {};
}

export type WeekChangeResult = {
  emailed?: boolean;
  emailSkipped?: boolean;
  emailError?: string;
};

export async function setCurrentWeek(
  clientId: string,
  week: number,
): Promise<WeekChangeResult> {
  await requireAdmin();
  const admin = createAdminClient();
  const target = Math.max(0, week);

  // Read the client's contact + prior position first, so we can tell an actual
  // forward unlock from a correction (and know who to email).
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name, current_week")
    .eq("id", clientId)
    .single();

  await admin.from("profiles").update({ current_week: target }).eq("id", clientId);
  revalidatePath("/admin");
  revalidatePath("/portal");

  // Email only on a genuine step forward. No email on a downward correction, on
  // a client with no email, or when the target week isn't published (nothing to
  // see yet).
  const prev = profile?.current_week ?? 0;
  if (!profile?.email || target <= prev) return {};

  const { data: wk } = await admin
    .from("weeks")
    .select("published")
    .eq("number", target)
    .maybeSingle();
  if (!wk || !wk.published) return {};

  // Each week has its own hand-written email. If this week hasn't got one yet,
  // send nothing (we never send generic filler) and tell the admin.
  const content = weekEmail(target);
  if (!content) return { emailSkipped: true };

  // Best-effort: a mail failure must never undo the week change the practitioner
  // just made. Surface it to the admin UI instead of throwing.
  try {
    await sendWeekUnlockEmail({
      to: profile.email,
      name: profile.full_name,
      weekNumber: target,
      content,
    });
    return { emailed: true };
  } catch (e) {
    console.error("week-unlock email failed:", e);
    return { emailError: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function createWeek(formData: FormData) {
  await requireAdmin();
  const number = parseInt(String(formData.get("number") ?? ""), 10);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!number || !title) throw new Error("Week number and title are required");

  const admin = createAdminClient();
  await admin.from("weeks").insert({ number, title, description, published: false });
  revalidatePath("/admin");
}

// Editing a week used to mean deleting it and adding it again — which destroys
// its uploaded files and, because clients are gated on week number, briefly hides
// the session from anyone already on it. Renaming is now a rename.
export async function updateWeek(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("week_id") ?? "");
  const number = parseInt(String(formData.get("number") ?? ""), 10);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!id) return { error: "Missing week." };
  if (!number || !title) return { error: "Number and title are both required." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("weeks")
    .update({ number, title, description })
    .eq("id", id);

  if (error) {
    // 23505 is the unique constraint on weeks.number.
    if (error.code === "23505") {
      return { error: `Week ${number} already exists. Pick a different number.` };
    }
    return { error: error.message };
  }
  revalidatePath("/admin");
  revalidatePath("/portal");
  return {};
}

export async function togglePublish(weekId: string, published: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("weeks").update({ published }).eq("id", weekId);
  revalidatePath("/admin");
}

export async function deleteWeek(weekId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  // Remove stored objects for this week, then the row (cascades to file rows).
  const { data: files } = await admin
    .from("files")
    .select("storage_path")
    .eq("week_id", weekId);
  if (files?.length) {
    await admin.storage.from("worksheets").remove(files.map((f) => f.storage_path));
  }
  await admin.from("weeks").delete().eq("id", weekId);
  revalidatePath("/admin");
}

export async function uploadFile(formData: FormData) {
  await requireAdmin();
  const weekId = String(formData.get("week_id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const file = formData.get("file") as File | null;
  if (!weekId || !file || (kind !== "worksheet" && kind !== "resource")) {
    throw new Error("Invalid upload");
  }

  const admin = createAdminClient();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${weekId}/${crypto.randomUUID()}-${safeName}`;

  const { error: upErr } = await admin.storage
    .from("worksheets")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (upErr) throw upErr;

  await admin.from("files").insert({
    week_id: weekId,
    kind,
    title: file.name,
    storage_path: path,
  });
  revalidatePath("/admin");
}

export async function deleteFile(fileId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: file } = await admin
    .from("files")
    .select("storage_path")
    .eq("id", fileId)
    .single();
  if (file) {
    await admin.storage.from("worksheets").remove([file.storage_path]);
    await admin.from("files").delete().eq("id", fileId);
  }
  revalidatePath("/admin");
}

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin
    .from("settings")
    .update({
      calendly_url: String(formData.get("calendly_url") ?? "").trim(),
      session_length: String(formData.get("session_length") ?? "").trim(),
      session_format: String(formData.get("session_format") ?? "").trim(),
    })
    .eq("id", true);
  revalidatePath("/admin");
  revalidatePath("/portal");
}


/* ---------------- completion machinery (ADR-0020 / ADR-0021) ---------------- */

// Drift is the documented failure mechanism: sessions slip, a few weeks pass,
// momentum goes. These two actions are the cheapest known counter — a weekly
// "where are you?" and a way to see who has gone quiet.
//
// Deliberately one-click rather than automatic. A nudge that fires the morning
// after a session reads badly and costs trust; the coach stays in the loop.
//
// Under ADR-0021 (rolling one-ahead booking) this stopped being one of three
// redundant safety nets and became the only backstop against an empty diary.

export async function sendCheckIn(clientId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", clientId)
    .single();

  if (!client?.email) return { ok: false, error: "That client has no email address." };

  const content = loadNamedEmail("check-in");
  if (!content) return { ok: false, error: "emails/check-in.txt is missing or malformed." };

  try {
    await sendCheckInEmail({ to: client.email, name: client.full_name, content });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed." };
  }

  await admin
    .from("profiles")
    .update({ last_nudge_at: new Date().toISOString() })
    .eq("id", clientId);

  revalidatePath("/admin");
  return { ok: true };
}

// "I heard back from them." Resets the quiet counter without sending anything.
export async function markHeard(clientId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", clientId);

  revalidatePath("/admin");
  return { ok: true };
}
