"use client";

import { useFormState, useFormStatus } from "react-dom";
import { setPassword, type SetPasswordState } from "./actions";

const initial: SetPasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="psy-btn mt-5 w-full" disabled={pending}>
      {pending ? "Saving…" : "Save password"}
    </button>
  );
}

export function SetPasswordForm() {
  const [state, formAction] = useFormState(setPassword, initial);

  if (state.ok) {
    return (
      <div className="psy-card p-8 text-center">
        <div className="mb-3 text-2xl">✅</div>
        <h1 className="font-disp text-xl font-semibold">Password saved</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          You can now sign in with your email and password next time. Your
          sign-in link still works too, as a backup.
        </p>
      </div>
    );
  }

  return (
    <div className="psy-card p-8">
      <h1 className="font-disp text-xl font-semibold">Set a password</h1>
      <p className="mb-1 mt-1.5 text-sm leading-relaxed text-slate">
        Add a password to sign in without waiting for an email link. Forgotten
        it in future? Sign in with a magic link, then change it here.
      </p>

      <form action={formAction}>
        <label className="psy-label">New password</label>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          className="psy-input"
          placeholder="At least 8 characters"
        />

        <label className="psy-label">Confirm password</label>
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          className="psy-input"
          placeholder="Re-enter your password"
        />

        {state.error && (
          <p className="mt-4 rounded-[9px] border border-bad/30 bg-bad/10 px-3 py-2.5 text-sm text-[#f0a99f]">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
