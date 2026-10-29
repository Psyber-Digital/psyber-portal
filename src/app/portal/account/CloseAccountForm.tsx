"use client";

import { useFormState, useFormStatus } from "react-dom";
import { closeAccount, type CloseState } from "./closeActions";

const initial: CloseState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-4 w-full rounded-[10px] border border-bad/40 px-4 py-2.5 text-sm font-semibold text-[#f0a99f] hover:bg-bad/10"
    >
      {pending ? "Closing…" : "Close my account"}
    </button>
  );
}

// Build terms 8.2 and 10.3. WORDING: board card (29 Oct).
export function CloseAccountForm({ paying }: { paying: boolean }) {
  const [state, formAction] = useFormState(closeAccount, initial);

  return (
    <div className="psy-card mt-5 p-8">
      <h2 className="font-disp text-base font-semibold">Close my account</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate">
        <li>Your account and your contact list are deleted. This can’t be undone.</li>
        <li>
          Want a copy of your list?{" "}
          <a href="/api/outreach/export" className="font-semibold text-blue">
            Download it first
          </a>
          .
        </li>
        {paying && (
          <li>Your Build membership stops now. There’s no refund for the time left.</li>
        )}
      </ul>
      <form action={formAction}>
        <label className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-slate">
          <input type="checkbox" name="confirm_close" required className="mt-1" />
          <span>I understand my account and contact list will be deleted.</span>
        </label>
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
