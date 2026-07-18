"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function setCurrentWeek(clientId: string, week: number) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ current_week: Math.max(0, week) })
    .eq("id", clientId);
  revalidatePath("/admin");
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
