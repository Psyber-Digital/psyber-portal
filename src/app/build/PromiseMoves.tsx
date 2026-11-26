"use client";

import { useState } from "react";

// The four promises at the top of /build, played as Next Move (Don, 26 Nov
// 2026: "Use the 4 cards at the top to demonstrate Next Move - interactivity").
// One card at a time is "your next move". Tap it: it ticks off, points go up,
// and the next one lights up. The words are the page's own.
const PROMISES = [
  ["clock", "Do it in your own time.", "No fixed schedule. Evenings, weekends, between clients: you choose."],
  ["compass", "Don’t get stuck.", "Always know what to do next."],
  ["stack", "Everything in one place.", "All the resources you need, packaged in Next Move."],
  ["trophy", "Progress becomes fun.", "Your moves score points. Every chapter levels you up."],
] as const;
const POINTS = 5;

export function PromiseMoves() {
  const [done, setDone] = useState<number[]>([]);
  const next = PROMISES.findIndex((_, i) => !done.includes(i));
  const all = next === -1;
  const tick = (i: number) => setDone((d) => (d.includes(i) ? d : [...d, i]));
  const points = done.length * POINTS;

  return (
    <div>
      <div className="mx-auto mb-4 flex max-w-[520px] items-center gap-3">
        <span className="font-disp text-[13px] font-semibold text-off">
          {all ? "All 4 moves done!" : `Move ${next + 1} of 4`}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <i
            className="block h-full rounded-full bg-[linear-gradient(90deg,#FF8D1E,#1E90FF)] transition-[width] duration-500"
            style={{ width: `${(done.length / PROMISES.length) * 100}%` }}
          />
        </div>
        <span className="font-disp text-[13px] font-semibold text-orange">{points} points</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PROMISES.map(([icon, h, t], i) => {
          const isDone = done.includes(i);
          const isNext = i === next;
          return (
            <button
              key={h}
              type="button"
              onClick={() => tick(i)}
              aria-pressed={isDone}
              className={`relative rounded-[18px] border p-5 text-center transition duration-300 ${
                isDone
                  ? "border-[#2f6b45] bg-[#13281c]"
                  : isNext
                    ? "border-orange bg-[linear-gradient(160deg,rgba(255,141,30,0.22),rgba(255,141,30,0.04))] shadow-[0_0_0_3px_rgba(255,141,30,0.18)] hover:-translate-y-0.5"
                    : "border-orange/30 bg-[linear-gradient(160deg,rgba(255,141,30,0.12),rgba(255,141,30,0.02))] opacity-80 hover:opacity-100"
              }`}
            >
              {isNext && (
                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange px-2.5 py-0.5 font-disp text-[10.5px] font-bold uppercase tracking-[1.2px] text-[#241100]">
                  Your next move
                </span>
              )}
              <span
                className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl text-[#241100] transition ${
                  isDone ? "bg-[#9be7b0]" : "bg-[radial-gradient(circle_at_35%_30%,#ffd29e,#FF8D1E_55%,#c45f00)] shadow-[0_8px_24px_-8px_rgba(255,141,30,0.6)]"
                }`}
              >
                {isDone ? <Tick /> : <PromiseIcon name={icon} />}
              </span>
              <span className="mt-2 block font-disp text-[19px] font-semibold text-off">{h}</span>
              <span className="mt-1 block text-[14px] leading-relaxed text-sec">{t}</span>
              <span className={`mt-3 inline-block rounded-full px-3 py-1 font-disp text-[12.5px] font-semibold ${
                isDone ? "text-[#9be7b0]" : "bg-[#0B1220] text-off"
              }`}>
                {isDone ? `Done ✓ +${POINTS} points` : "Tap: Done ✓"}
              </span>
            </button>
          );
        })}
      </div>

      {all && (
        <p className="mt-4 text-center font-disp text-[15px] font-semibold text-[#9be7b0]" role="status">
          That&rsquo;s Next Move: one move, ticked off, and the next one waiting.
        </p>
      )}
    </div>
  );
}

function Tick() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Drawn icons for the four promises (Don, 26 Nov 2026). One stroke weight, so
// they read as a set; emoji looked different on every phone.
function PromiseIcon({ name }: { name: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      {name === "clock" && (
        <>
          <circle cx="12" cy="12" r="8.5" {...p} />
          <path d="M12 7.5V12l3 2" {...p} />
        </>
      )}
      {name === "compass" && (
        <>
          <circle cx="12" cy="12" r="8.5" {...p} />
          <path d="M15.5 8.5l-2 5-5 2 2-5z" {...p} />
        </>
      )}
      {name === "stack" && (
        <>
          <path d="M12 4l8 4-8 4-8-4z" {...p} />
          <path d="M4 12l8 4 8-4" {...p} />
          <path d="M4 16l8 4 8-4" {...p} />
        </>
      )}
      {name === "trophy" && (
        <>
          <path d="M8 4h8v5a4 4 0 01-8 0z" {...p} />
          <path d="M8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4" {...p} />
          <path d="M12 13v4M9 20h6M10 17h4" {...p} />
        </>
      )}
    </svg>
  );
}
