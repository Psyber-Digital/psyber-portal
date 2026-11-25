"use client";

import { useEffect, useRef, useState } from "react";
import { burstAt } from "./burst";
import { keepSprint } from "../moveActions";

// "Start a 25-minute sprint" (Don, card IM = A, 25 Nov 2026). A short, timed
// block of work on the move in front of you. Finishing one earns bonus
// points (twice a day at most). Turn on the focus sound beside it for music.
const SPRINT_MIN = 25;

export function SprintTimer() {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [left, setLeft] = useState(0);
  const [done, setDone] = useState(false);
  const kept = useRef(false);

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const ms = endsAt - Date.now();
      if (ms <= 0) {
        setEndsAt(null);
        setDone(true);
        burstAt(window.innerWidth / 2, window.innerHeight / 3);
        if (!kept.current) {
          kept.current = true;
          keepSprint().catch(() => {});
        }
        return;
      }
      setLeft(ms);
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [endsAt]);

  if (done) {
    return (
      <p className="mt-3 rounded-xl bg-[#0B1220]/85 px-4 py-3 text-[14px] text-off" role="status">
        <b className="text-[#9be7b0]">Sprint done! +10 points.</b> Tick the move when it&rsquo;s finished, or start another sprint.{" "}
        <button type="button" className="font-semibold underline" onClick={() => { setDone(false); kept.current = false; setEndsAt(Date.now() + SPRINT_MIN * 60000); }}>
          Go again
        </button>
      </p>
    );
  }
  if (endsAt) {
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    return (
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-[#0B1220]/85 px-4 py-3 text-off">
        <span className="font-disp text-[26px] font-bold tabular-nums">{m}:{String(s).padStart(2, "0")}</span>
        <span className="text-[13.5px] text-sec">Sprint on. One move, nothing else!</span>
        <button type="button" className="ml-auto text-[13px] underline" onClick={() => setEndsAt(null)}>Stop</button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => { kept.current = false; setEndsAt(Date.now() + SPRINT_MIN * 60000); }}
      className="mt-4 inline-block rounded-xl bg-[#0B1220] px-5 py-3 font-disp text-[14.5px] font-semibold text-white hover:bg-[#16213a]"
    >
      ⏱ Start a 25-minute sprint
    </button>
  );
}
