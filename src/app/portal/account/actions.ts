"use server";

import { createClient } from "@/lib/supabase/server";

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
