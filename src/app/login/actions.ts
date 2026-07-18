"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; sent?: boolean };

function siteUrl() {
  // Prefer explicit config; fall back to the request origin.
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

// Magic-link sign-in / register. One OTP flow; on register we attach the name
// as user metadata so the DB trigger records it on the new profile.
export async function sendMagicLink(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const mode = String(formData.get("mode") ?? "login");

  if (!email) return { error: "Enter your email address." };
  if (mode === "register" && !fullName)
    return { error: "Enter your name." };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/confirm`,
      shouldCreateUser: true,
      data: mode === "register" ? { full_name: fullName } : undefined,
    },
  });

  if (error) return { error: error.message };
  return { sent: true };
}
