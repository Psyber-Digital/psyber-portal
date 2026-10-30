"use client";

import { useFormStatus } from "react-dom";

// The "Mark Session N complete" form, with a "working" label while the
// database opens the next session. The jump back to the top of the page is
// ScrollTopOnChange's job: code here after the action never ran, because the
// page re-draw replaces this form (tested 30 Oct).
function FinishButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="psy-btn w-full sm:w-auto" disabled={pending}>
      {pending ? "Opening the next session…" : label}
    </button>
  );
}

export function FinishForm({
  action,
  week,
  label,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  week: number;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="week" value={week} />
      <FinishButton label={label} />
      {children}
    </form>
  );
}
