"use client";

import { useEffect, useState } from "react";
import { stopFocus, subscribe } from "./focusEngine";

// While the focus sound plays, a small pill on every portal page can stop it,
// because the main button only sits on Today (card PU, 25 Nov 2026).
export function FocusDock() {
  const [on, setOn] = useState(false);
  useEffect(() => subscribe((s) => setOn(s.on)), []);
  if (!on) return null;
  return (
    <button
      type="button"
      onClick={stopFocus}
      className="fixed bottom-4 right-4 z-40 rounded-full border border-blue bg-[#0B1220]/95 px-4 py-2 font-disp text-[13px] font-semibold text-blue shadow-card"
    >
      ♪ Focus sound on · Stop
    </button>
  );
}
