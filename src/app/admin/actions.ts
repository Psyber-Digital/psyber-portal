"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWeekUnlockEmail } from "@/lib/email";
import { weekEmail } from "@/lib/weekEmail";

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
