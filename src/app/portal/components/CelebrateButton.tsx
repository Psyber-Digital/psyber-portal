"use client";

import { useFormStatus } from "react-dom";
import { burstFrom } from "./burst";

// The Done button: a burst of colour, then the form saves the tick.
export function CelebrateButton({ label = "Done ✓", className = "psy-btn" }: { label?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => burstFrom(e.currentTarget)}
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
