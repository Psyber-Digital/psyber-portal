"use client";

import { useEffect, useRef, useState } from "react";
import { CHAPTERS } from "@/lib/story";

// The page plays like Build itself (Don, 26 Nov 2026: "have points and levels
// that go up as they go down the page"). Scrolling earns points and climbs the
// seven levels, named after Build's own chapters. It's a taste of the game
// inside, not a score anyone keeps: nothing is stored or sent.
const TOTAL_POINTS = 250;
const LEVELS = 7;

export function ScrollScore() {
  const [progress, setProgress] = useState(0);
  const [pop, setPop] = useState<number | null>(null);
  const lastLevel = useRef(1);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Points go up in fives; the level is the chapter you've scrolled into.
  const points = Math.round((progress * TOTAL_POINTS) / 5) * 5;
  const level = Math.min(LEVELS, 1 + Math.floor(progress * LEVELS * 0.999));
  const chapter = CHAPTERS[level]?.title ?? "";
  const done = progress > 0.97;

  useEffect(() => {
    if (level > lastLevel.current) {
      setPop(level);
      const t = setTimeout(() => setPop(null), 1400);
      lastLevel.current = level;
      return () => clearTimeout(t);
    }
    lastLevel.current = level;
  }, [level]);

  if (progress < 0.02) return null;

  return (
    <div
      className="fixed inset-x-3 bottom-[76px] z-40 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[280px]"
      role="status"
      aria-live="polite"
    >
      <div className="relative rounded-[16px] border border-orange/40 bg-[#0B1220]/95 px-3.5 py-2.5 shadow-card backdrop-blur">
        {pop && (
          <span className="absolute -top-3 right-3 rounded-full bg-orange px-2.5 py-0.5 font-disp text-[12px] font-bold text-[#241100]">
            Level {pop}!
          </span>
        )}
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-[radial-gradient(circle_at_35%_30%,#ffd29e,#FF8D1E_55%,#c45f00)] font-disp text-[16px] font-bold text-[#241100]">
            {level}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
              <b className="truncate font-disp font-semibold text-off">
                {done ? "All 7 levels!" : `Level ${level}: ${chapter}`}
              </b>
              <span className="flex-none text-orange">{points} pts</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
              <i
                className="block h-full rounded-full bg-[linear-gradient(90deg,#FF8D1E,#1E90FF)] transition-[width] duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            {done && (
              <a href="/join" className="mt-1.5 block text-[12px] font-semibold text-orange underline">
                That&rsquo;s the whole road. Start it free →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
