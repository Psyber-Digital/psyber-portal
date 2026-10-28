"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

// Magic-link sign-in for existing accounts only. New accounts are made on
// /join, behind the lane gate (Don, 28 Oct), so this never creates a user.
export async function sendMagicLink(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();

  if (!email) return { error: "Enter your email address." };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/confirm`,
      shouldCreateUser: false,
    },
  });

  // Same screen whether or not the email has an account, so the page never
  // reveals who is registered.
  if (error) console.error("login: link not sent:", error.status, error.message);
  return { sent: true };
}

// Password sign-in. Only works for users who have set a password on their
// account (via /portal/account). Everyone can still fall back to a magic link,
// which doubles as the password-recovery route.
export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password)
    return { error: "Enter your email and password." };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error)
    return {
      error:
        "That email and password don’t match. Try again, or use a sign-in link below.",
    };

  // Session cookie is set; hand off to the root router which sends the user to
  // /portal or /admin based on their role.
  redirect("/");
}
