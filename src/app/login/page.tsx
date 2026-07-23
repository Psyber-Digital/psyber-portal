"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Image from "next/image";
import {
  sendMagicLink,
  signInWithPassword,
  type AuthState,
} from "./actions";

const initial: AuthState = {};

type Mode = "password" | "link" | "register";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="psy-btn mt-5 w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="mt-4 rounded-[9px] border border-bad/30 bg-bad/10 px-3 py-2.5 text-sm text-[#f0a99f]">
      {message}
    </p>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("password");
  // Two independent actions: password sign-in, and the magic-link flow (used for
  // both the link fallback and registration).
  const [pwState, pwAction] = useFormState(signInWithPassword, initial);
  const [linkState, linkAction] = useFormState(sendMagicLink, initial);

  // The magic-link flow shows a "check your email" confirmation on success.
  if (linkState.sent) {
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

  return (
    <main className="relative z-10 mx-auto mt-[6vh] w-full max-w-[430px] px-5">
      <Logo />
      <div className="psy-card p-8">
        {mode === "password" && (
          <>
            <h1 className="font-disp text-xl font-semibold">Welcome back</h1>
            <p className="mb-1 mt-1.5 text-sm leading-relaxed text-slate">
              Sign in with your email and password.
            </p>

            <form action={pwAction}>
              <label className="psy-label">Email</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                className="psy-input"
                placeholder="you@email.com"
              />

              <label className="psy-label">Password</label>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                className="psy-input"
                placeholder="Your password"
              />

              {pwState.error && <ErrorNote message={pwState.error} />}

              <SubmitButton label="Sign in" pendingLabel="Signing in…" />
            </form>

            <p className="mt-5 text-center text-sm leading-relaxed text-slate">
              <span className="font-medium text-sec">
                First time, or forgotten your password?
              </span>{" "}
              <button
                type="button"
                onClick={() => setMode("link")}
                className="font-semibold text-blue"
              >
                Email yourself a sign-in link
              </button>{" "}
              — then set or change it under Account.
            </p>
            <p className="mt-3 text-center text-sm text-slate">
              New client?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="font-semibold text-blue"
              >
                Register here
              </button>
            </p>
          </>
        )}

        {mode === "link" && (
          <>
            <h1 className="font-disp text-xl font-semibold">Sign in with a link</h1>
            <p className="mb-1 mt-1.5 text-sm leading-relaxed text-slate">
              We’ll email you a secure sign-in link — no password needed. Once
              you’re in, set or change your password under Account.
            </p>

            <form action={linkAction}>
              <input type="hidden" name="mode" value="login" />
              <label className="psy-label">Email</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                className="psy-input"
                placeholder="you@email.com"
              />

              {linkState.error && <ErrorNote message={linkState.error} />}

              <SubmitButton
                label="Send me a sign-in link"
                pendingLabel="Sending…"
              />
            </form>

            <p className="mt-5 text-center text-sm text-slate">
              <button
                type="button"
                onClick={() => setMode("password")}
                className="font-semibold text-blue"
              >
                Use a password instead
              </button>
            </p>
          </>
        )}

        {mode === "register" && (
          <>
            <h1 className="font-disp text-xl font-semibold">
              Create your account
            </h1>
            <p className="mb-1 mt-1.5 text-sm leading-relaxed text-slate">
              Register to begin. We’ll email you a secure link to confirm.
              Access to each week is granted by your practitioner after your
              session.
            </p>

            <form action={linkAction}>
              <input type="hidden" name="mode" value="register" />
              <label className="psy-label">Full name</label>
              <input
                name="full_name"
                className="psy-input"
                placeholder="Your name"
              />
              <label className="psy-label">Email</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                className="psy-input"
                placeholder="you@email.com"
              />

              {linkState.error && <ErrorNote message={linkState.error} />}

              <SubmitButton label="Create account" pendingLabel="Sending…" />
            </form>

            <p className="mt-5 text-center text-sm text-slate">
              Already registered?{" "}
              <button
                type="button"
                onClick={() => setMode("password")}
                className="font-semibold text-blue"
              >
                Sign in
              </button>
            </p>
          </>
        )}
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
