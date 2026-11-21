"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SetPasswordState = { error?: string; ok?: boolean };

// Sets (or changes) the signed-in user's password. Reached after a magic-link
// login, so the session is already established. updateUser writes the password
// to the current Supabase auth user; afterwards they can sign in with it.
export async function setPassword(
  _prev: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don’t match." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { error: "Your session has expired. Please sign in again." };

  // Stamp a flag on the user's auth metadata so the portal stops prompting them
  // to set a password. (Supabase has no direct "has password" field to read.)
  const { error } = await supabase.auth.updateUser({
    password,
    data: { has_password: true },
  });
  if (error) return { error: error.message };

  return { ok: true };
}

// How a self-serve member wants to work (Don, d6 A, 21 Nov 2026: chosen at
// sign-up, changeable later). Members can't write their own profile (RLS,
// 0002), so this updates the one column, for the signed-in member only, on
// the server.
export async function setWorkStyle(formData: FormData) {
  const v = String(formData.get("work") ?? "");
  if (v !== "one_on_one" && v !== "own") return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.from("profiles").select("tier").eq("id", user.id).single();
  if (!profile || !["foundations", "build"].includes(profile.tier)) return;
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ wants_one_on_one: v === "one_on_one" })
    .eq("id", user.id);
  if (error) console.error("setWorkStyle failed:", error.message);
  revalidatePath("/portal/account");
}
