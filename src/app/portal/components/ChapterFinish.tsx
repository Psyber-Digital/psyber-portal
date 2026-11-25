"use client";

import { useEffect, useState } from "react";
import { burstAt } from "./burst";

// The level-up: shown once, full screen, the first time this browser sees a
// chapter finished (board m18, 19 Nov 2026). Shown on the free Session 1
// finish too, since 25 Nov 2026: the $99 offer is gone, and a peak at the end
// is the moment members remember (research card AD2). There the next chapter
// shows locked, and the button leads to the "Join Build" card on Today. The memory is a per-viewer convenience in
// browser storage; if storage is blocked nothing shows, which is safe. The
// first visit only records where the member is, so nobody gets an old one.

export type ChapterFinishInfo = {
  number: number;
  villain: string;
  done: string;
  moves: number;
  next?: { number: number; title: string; villain: string };
};

export function ChapterFinish({
  finishedThrough,
  info,
  names,
  points,
  memberKey,
  enabled,
  locked = false,
  justFinished = false,
}: {
  finishedThrough: number;
  info?: ChapterFinishInfo;
  names: number;
  points: number;
  memberKey: string;
  enabled: boolean;
  /** Build Free: the next chapter opens in Build (research card AD2, 25 Nov 2026). */
  locked?: boolean;
  /** The page was opened right after a session finished (?opened=N). The
   *  first chapter used to be missed: on its first mount the memory was
   *  empty, so it only recorded (walk-through, 25 Nov 2026). */
  justFinished?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled || !info) return;
    const key = `psy-chapter-${memberKey}`;
    let seen: number | null = null;
    try {
      const raw = window.localStorage.getItem(key);
      seen = raw === null ? null : Number(raw);
      window.localStorage.setItem(key, String(finishedThrough));
    } catch {
      return;
    }
    // Open once per chapter: when this browser saw an earlier chapter, or right
    // after the finish (?opened=N) on a first visit. A refresh never reopens it.
    const fresh = seen === null ? justFinished : finishedThrough > seen;
    if (!fresh) return;
    setOpen(true);
    burstAt(window.innerWidth / 2, window.innerHeight / 3);
  }, [enabled, info, finishedThrough, memberKey, justFinished]);

  if (!open || !info) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapter-finish-title"
      className="fixed inset-0 z-50 grid place-items-center bg-[#050a14]/80 p-6 backdrop-blur-sm"
    >
      <div className="psy-deck-card w-full max-w-[360px] rounded-[22px] border border-[#3b5a92] bg-[linear-gradient(160deg,#1a2744,#121B2E)] px-6 py-7 text-center shadow-card">
        <span className="mx-auto grid h-[86px] w-[86px] place-items-center rounded-[24px] bg-[radial-gradient(circle_at_35%_30%,#ffd29e,#FF8D1E_55%,#c45f00)] font-disp text-[20px] font-bold leading-tight text-[#241100] shadow-[0_10px_30px_rgba(255,141,30,.4)]">
          {info.next ? (
            <>
              Level
              <br />
              {info.next.number}
            </>
          ) : (
            "🏁"
          )}
        </span>
        <h3 id="chapter-finish-title" className="mt-4 font-disp text-[22px] font-semibold text-off">
          Chapter {info.number} (Session {info.number}) complete
        </h3>
        <span className="mt-1.5 inline-block rounded-full bg-[#16391f] px-3 py-1 font-disp text-[12px] font-semibold text-[#9be7b0]">
          You beat {info.villain}
        </span>
        <p className="mt-2 text-[14px] leading-relaxed text-sec">{info.done}</p>
        {info.next && (
          <p className="mt-3 font-disp text-[13px] font-semibold leading-snug text-orange">
            {locked ? (
              <>🔒 Next villain: {info.next.villain}. Chapter {info.next.number}, {info.next.title}, opens in Build™.</>
            ) : (
              <>Next villain: {info.next.villain}. Chapter {info.next.number}, {info.next.title}, shows you how to beat it.</>
            )}
          </p>
        )}
        <div className="my-4 grid grid-cols-3 gap-1.5">
          {[
            [info.moves, "moves"],
            [names, names === 1 ? "name" : "names"],
            [points, "points"],
          ].map(([n, label]) => (
            <div key={String(label)} className="rounded-[10px] border border-line bg-panel px-1 py-2 text-[11px] text-mut">
              <b className="block font-disp text-[18px] font-bold text-off">{n}</b>
              {label}
            </div>
          ))}
        </div>
        <button type="button" className="psy-btn-orange w-full" onClick={() => setOpen(false)}>
          {locked ? "See my next move" : info.next ? `On to Chapter ${info.next.number}` : "Keep going"}
        </button>
      </div>
    </div>
  );
}
