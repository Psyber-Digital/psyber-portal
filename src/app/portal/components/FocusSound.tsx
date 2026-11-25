"use client";

import { useEffect, useState } from "react";
import { subscribe, toggleFocus } from "./focusEngine";

// A short, catchy loop for when a member sits down to do a move (Don, board m19,
// 19 Nov 2026: "change the focus sound to a catchy few second loop"). The file
// is "Lofi Beat Loop" by BFCMUSIC from Pixabay (public/audio/CREDITS.md; Don's
// pick, m21 "A"), played on repeat through Web Audio so the seam doesn't gap. It never starts
// on its own. The wording makes no claim about what it does to the brain.

export function FocusSound() {
  const [{ on, busy }, setS] = useState({ on: false, busy: false });
  const [info, setInfo] = useState(false);
  // The player itself lives in focusEngine, so it keeps playing across pages.
  useEffect(() => subscribe(setS), []);
  const toggle = toggleFocus;

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        className={`rounded-full border px-3.5 py-1.5 font-disp text-[12.5px] font-semibold ${
          on ? "border-blue bg-blue/15 text-blue" : "border-orange/60 bg-orange/10 text-orange hover:bg-orange/20"
        }`}
      >
        {busy ? "♪ Starting…" : on ? "♪ Focus sound on" : "♪ Focus sound"}
      </button>
      <button
        type="button"
        onClick={() => setInfo((v) => !v)}
        aria-expanded={info}
        aria-label="What is the focus sound?"
        className="grid h-6 w-6 place-items-center rounded-full border border-line font-disp text-[12px] font-semibold text-mut hover:text-off"
      >
        i
      </button>
      {info && (
        <div role="note" className="absolute right-0 top-10 z-20 max-w-[320px] rounded-[14px] border border-line bg-panel p-4 text-[13px] leading-relaxed text-sec shadow-card">
          <b className="block font-disp text-[13.5px] font-semibold text-off">Focus sound</b>
          A short, catchy loop to work to. Turn it on when you sit down to a move, and off when you finish. It
          keeps playing as you move around the portal, until you turn it off.
        </div>
      )}
    </div>
  );
}
