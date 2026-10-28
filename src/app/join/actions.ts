"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Self-serve sign-up behind the lane gate (Offer Ladder stage 3, ADR-0027).
// The rules live in SQL (lane_gate_refusal, 0007). This action only checks
// that every question was answered, then asks the database: a refusal code
// means no account is created; null means sign up, and the handle_new_user
// trigger grants Foundations.

export type Refusal = "A1" | "A2" | "B1" | "B2" | "C";
export type JoinState = { error?: string; refusal?: Refusal; sent?: boolean };

// The answers the SQL reads. Key names must match lane_gate_refusal exactly:
// a missing or misspelt key is read as a refusal.
type Answers = {
  license: "independent" | "retired" | "training" | "none" | "";
  license_type: string;
  license_state: string;
  license_number: string;
  tick_not_treatment: boolean;
  tick_outside_caseload: boolean;
  coaches_therapy_clients: boolean | null;
};

// Change this whenever the terms change, so each account records which
// version it accepted.
const TERMS_VERSION = "build-terms-v4-draft-2026-10-27";

const TRACKED = [
  "license",
  "tick_not_treatment",
  "tick_outside_caseload",
  "coaches_therapy_clients",
] as const;

function siteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

const str = (v: unknown, max = 500) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const bool = (v: unknown) => v === true;
const yesNo = (v: unknown) => (v === true || v === false ? v : null);

// Rebuild the answers from known keys only, with real types, so nothing extra
// from the browser reaches the database.
function clean(raw: Record<string, unknown>): Answers {
  const license = ["independent", "retired", "training", "none"].includes(
    raw.license as string,
  )
    ? (raw.license as Answers["license"])
    : "";
  const held = license === "independent" || license === "retired";
  return {
    license,
    license_type: held ? str(raw.license_type, 40) : "",
    license_state: held ? str(raw.license_state, 40) : "",
    license_number: held ? str(raw.license_number, 60) : "",
    tick_not_treatment: bool(raw.tick_not_treatment),
    tick_outside_caseload: bool(raw.tick_outside_caseload),
    coaches_therapy_clients: yesNo(raw.coaches_therapy_clients),
  };
}

function cleanFirst(raw: unknown) {
  const out: Record<string, string | boolean> = {};
  if (raw && typeof raw === "object") {
    for (const k of TRACKED) {
      const v = (raw as Record<string, unknown>)[k];
      if (typeof v === "boolean" || (typeof v === "string" && v.length <= 20))
        out[k] = v;
    }
  }
  return out;
}

// An unanswered question is a prompt to answer it, never a refusal.
function missing(a: Answers): string | null {
  if (!a.license) return "Answer question 1.";
  if (
    (a.license === "independent" || a.license === "retired") &&
    (!a.license_type || !a.license_state || !a.license_number)
  )
    return "Add your license type, state and number.";
  if (a.coaches_therapy_clients === null) return "Answer question 3.";
  return null;
}

export async function join(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const fullName = str(formData.get("full_name"), 120);
  const email = str(formData.get("email"), 320).toLowerCase();
  const password = String(formData.get("password") ?? "");

  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(String(formData.get("gate") ?? "{}"));
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
  const answers = clean(raw);

  const gap = missing(answers);
  if (gap) return { error: gap };
  if (!fullName) return { error: "Enter your name." };
  if (!email) return { error: "Enter your email address." };
  if (password.length < 8)
    return { error: "Your password needs at least 8 characters." };

  const supabase = createClient();

  // The database decides, and records a refusal before any account exists.
  const { data: refusal, error: rpcError } = await supabase.rpc(
    "record_signup_refusal",
    { p_email: email, p_answers: answers },
  );
  if (rpcError) return { error: "Something went wrong. Please try again." };
  if (refusal) return { refusal: refusal as Refusal };

  // Build terms 12.2: the tick box is the acceptance, so it is required here,
  // and the version accepted is stored with the answers.
  if (formData.get("accept_terms") !== "on")
    return { error: "Tick the box to accept the terms." };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/confirm`,
      data: {
        full_name: fullName,
        gate: {
          ...answers,
          terms_version: TERMS_VERSION,
          terms_accepted_at: new Date().toISOString(),
          first: cleanFirst(raw.first),
        },
      },
    },
  });

  // Never show Supabase's own text: it can reveal that an email is registered.
  if (error) {
    console.error("join: signUp failed:", error.status, error.message);
    if (/already registered|already exists/i.test(error.message))
      return { sent: true };
    if (/email/i.test(error.message) && /invalid/i.test(error.message))
      return { error: "Check your email address." };
    return { error: "We couldn’t create your account. Please try again." };
  }

  // With email confirmation off, Supabase signs the person straight in.
  if (data.session) redirect("/");

  // Same screen whether or not the email already had an account, so the page
  // never reveals who is registered.
  return { sent: true };
}
