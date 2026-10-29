"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Don's controls for the weekly clinic (Offer Ladder stage 5). Every write goes
// through the signed-in admin's own session, so the clinic tables' RLS (0015)
// is the gate: a non-admin's write is refused by the database.

export type ClinicResult = { error?: string; ok?: string };

export async function saveClinicSettings(
  _prev: ClinicResult,
  formData: FormData,
): Promise<ClinicResult> {
  const zoom = String(formData.get("zoom_url") ?? "").trim();
  const notice = String(formData.get("notice") ?? "").trim().slice(0, 300);
  if (zoom && !/^https:\/\/([a-z0-9-]+\.)?zoom\.us\//.test(zoom))
    return { error: "That doesn't look like a Zoom link (https://…zoom.us/…)." };

  const supabase = createClient();
  const { error } = await supabase
    .from("clinic_settings")
    .update({ zoom_url: zoom, notice, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) return { error: error.message };
  revalidatePath("/admin/clinic");
  return { ok: "Saved." };
}

export async function addRecording(
  _prev: ClinicResult,
  formData: FormData,
): Promise<ClinicResult> {
  const date = String(formData.get("clinic_date") ?? "");
  // Accepts a Vimeo link or a bare id; keeps the private hash if the link has one.
  const raw = String(formData.get("vimeo") ?? "").trim();
  const m = raw.match(/(?:vimeo\.com\/(?:video\/)?)?(\d{5,})(?:[/?](?:h=)?([0-9a-f]{6,}))?/);
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Pick the clinic date." };
  if (!m) return { error: "Paste the Vimeo link or video number." };

  const supabase = createClient();
  const { error } = await supabase
    .from("clinic_recordings")
    .insert({ clinic_date: date, vimeo_id: m[1], vimeo_hash: m[2] ?? "", title });
  if (error) return { error: error.message };
  revalidatePath("/admin/clinic");
  return { ok: "Recording added." };
}

export async function removeRecording(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = createClient();
  await supabase.from("clinic_recordings").delete().eq("id", id);
  revalidatePath("/admin/clinic");
}
