"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Image from "next/image";
import { sendMagicLink, type AuthState } from "./actions";

const initial: AuthState = {};

function SubmitButton({ mode }: { mode: "login" | "register" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="psy-btn mt-5 w-full" disabled={pending}>
      {pending
        ? "Sending…"
        : mode === "login"
          ? "Send me a sign-in link"
          : "Create account"}
    </button>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [state, formAction] = useFormState(sendMagicLink, initial);

  if (state.sent) {
    return (
      <main className="relative z-10 mx-auto mt-[8vh] w-full max-w-[430px] px-5">
        <Logo />
        <div className="psy-card p-9 text-center">
          <div className="mb-3 text-2xl">✉️</div>
          <h1 className="font-disp text-xl font-semibold">Check your email</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            We’ve sent a secure sign-in link. Open it on this device to enter
            the portal. You can close this tab.
          </p>
        </div>
      </main>
    );
  }

  const login = mode === "login";
  return (
    <main className="relative z-10 mx-auto mt-[6vh] w-full max-w-[430px] px-5">
      <Logo />
      <div className="psy-card p-8">
        <h1 className="font-disp text-xl font-semibold">
          {login ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mb-1 mt-1.5 text-sm leading-relaxed text-slate">
          {login
            ? "Enter your email and we’ll send you a secure sign-in link — no password needed."
            : "Register to begin. Access to each week is granted by your practitioner after your session."}
        </p>

        <form action={formAction}>
          <input type="hidden" name="mode" value={mode} />
          {!login && (
            <>
              <label className="psy-label">Full name</label>
              <input name="full_name" className="psy-input" placeholder="Your name" />
            </>
          )}
          <label className="psy-label">Email</label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            className="psy-input"
            placeholder="you@email.com"
          />

          {state.error && (
            <p className="mt-4 rounded-[9px] border border-bad/30 bg-bad/10 px-3 py-2.5 text-sm text-[#f0a99f]">
              {state.error}
            </p>
          )}

          <SubmitButton mode={mode} />
        </form>

        <p className="mt-5 text-center text-sm text-slate">
          {login ? "New client? " : "Already registered? "}
          <button
            type="button"
            onClick={() => setMode(login ? "register" : "login")}
            className="font-semibold text-blue"
          >
            {login ? "Register here" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}

function Logo() {
  return (
    <div className="mb-7 flex justify-center">
      <Image
        src="/wordmark.png"
        alt="Psyber Digital"
        width={280}
        height={54}
        priority
        className="h-11 w-auto"
      />
    </div>
  );
}
