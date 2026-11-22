"use client";

import { useState } from "react";

// A playable taste of Next Move on the public Build page (Don, card N1, 22 Nov
// 2026: "use engagement and interactivity (showcasing the elements of Build)
// like we did for new Quranic Family website"). Every figure is the portal's
// own: the four Session 2 moves and their times (lib/moves.ts), points per kind
// (lib/points.ts: video 5, sheet 20, name 10), the chapter 2 villain and how to
// beat it (lib/story.ts), level = chapter (NextMove.tsx), and the list target
// of 250 (lib/contacts.ts LIST_TARGET). Nothing here is saved.

const MOVES = [
  { title: "Watch the Niche video", mins: "7 min", kind: "Video", pts: 5 },
  { title: "Generate every transformation and audience you can think of", mins: "25 min", kind: "Working Sheet", pts: 20 },
  { title: "Narrow your ideas down to your top three, using the lane test", mins: "20 min", kind: "Working Sheet", pts: 20 },
  { title: "Research your top three: four quick checks", mins: "45 min", kind: "Working Sheet", pts: 20 },
];

const NAMES = ["A former colleague", "Your book club host", "A friend from college", "A parent from your kid's school", "A neighbor who runs a gym"];

type Tab = "move" | "villain" | "list";

export function BuildDemo() {
  const [tab, setTab] = useState<Tab>("move");
  return (
    <div className="rounded-[24px] border border-line bg-[#0E1626] p-4 shadow-2xl sm:p-6">
      <div className="flex gap-2 rounded-full bg-white/5 p-1">
        {(
          [
            ["move", "Do a move"],
            ["villain", "Beat the villain"],
            ["list", "Grow your list"],
          ] as [Tab, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 rounded-full px-2 py-2 font-disp text-[12.5px] font-semibold transition sm:text-[14px] ${
              tab === k ? "bg-orange text-[#1a0d00]" : "text-sec hover:text-off"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="mt-5 min-h-[330px]">
        {tab === "move" && <MoveDemo />}
        {tab === "villain" && <VillainDemo />}
        {tab === "list" && <ListDemo />}
      </div>
      <p className="mt-3 text-center text-[11.5px] text-slate">A live demo. Tap away: nothing is saved.</p>
      <style>{"@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}"}</style>
    </div>
  );
}

function MoveDemo() {
  const [i, setI] = useState(0);
  const [points, setPoints] = useState(0);
  const [pop, setPop] = useState<number | null>(null);
  const done = i >= MOVES.length;
  const m = MOVES[Math.min(i, MOVES.length - 1)];
  const tick = () => {
    if (done) return;
    setPoints((p) => p + m.pts);
    setPop(m.pts);
    window.setTimeout(() => setPop(null), 900);
    setI((n) => n + 1);
  };
  return (
    <div>
      <div className="flex items-center justify-between text-[12.5px] text-sec">
        <span className="font-disp font-semibold text-off">Chapter 2 · Choose your niche</span>
        <span>
          Level {done ? 3 : 2} · <b className="text-orange">{points}</b> points
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-orange transition-all duration-500" style={{ width: `${(i / MOVES.length) * 100}%` }} />
      </div>
      {!done ? (
        <div key={i} className="relative mt-5 animate-[fadeIn_.35s_ease] rounded-[18px] border border-[#ffb36b] bg-[linear-gradient(135deg,#FFA54A,#E8780F)] p-5 text-[#1a0d00]">
          {pop !== null && (
            <span className="absolute -top-3 right-4 animate-bounce rounded-full bg-[#0B1220] px-3 py-1 font-disp text-[13px] font-bold text-white">
              +{pop}
            </span>
          )}
          <div className="font-disp text-[11px] font-semibold uppercase tracking-[1.6px]">
            Your next move
          </div>
          <p className="mt-2 font-disp text-[20px] font-semibold leading-snug">{m.title}</p>
          <p className="mt-1 text-[13.5px]">
            {m.mins} · {m.kind} · +{m.pts} points
          </p>
          <button onClick={tick} className="mt-4 w-full rounded-[12px] bg-[#0B1220] py-3 font-disp text-[15px] font-semibold text-white transition hover:scale-[1.02] active:scale-[0.98]">
            Done ✓
          </button>
        </div>
      ) : (
        <div className="mt-5 animate-[fadeIn_.35s_ease] rounded-[18px] border-2 border-orange bg-orange/10 p-6 text-center">
          <div className="text-[40px]">🎉</div>
          <p className="mt-1 font-disp text-[22px] font-semibold text-off">Level up!</p>
          <p className="mt-1 text-[14px] text-sec">
            {points} points. On to Chapter 3: find your words.
          </p>
          <button onClick={() => { setI(0); setPoints(0); }} className="mt-4 text-[13px] font-semibold text-blue">
            Play again
          </button>
        </div>
      )}
    </div>
  );
}

function VillainDemo() {
  const [beaten, setBeaten] = useState(false);
  return (
    <div>
      <div className="font-disp text-[12.5px] font-semibold text-sec">Chapter 2 · Choose your niche</div>
      <div className="mt-3 rounded-[18px] border border-line bg-[#121B2E] p-5">
        <div className="flex items-center gap-3">
          <span className="text-[34px]">{beaten ? "🏆" : "🕸️"}</span>
          <div>
            <div className="font-disp text-[11px] font-semibold uppercase tracking-[1.6px] text-orange">This chapter’s villain</div>
            <div className={`font-disp text-[20px] font-semibold ${beaten ? "text-slate line-through" : "text-off"}`}>The Wide Net</div>
          </div>
        </div>
        <p className="mt-4 rounded-[12px] bg-white/5 p-3 text-[14.5px] italic text-sec">
          It says: “I can help all sorts of people with all sorts of things.”
        </p>
        {!beaten ? (
          <button onClick={() => setBeaten(true)} className="mt-4 w-full rounded-[12px] bg-orange py-3 font-disp text-[15px] font-semibold text-[#1a0d00] transition hover:scale-[1.02] active:scale-[0.98]">
            Beat it
          </button>
        ) : (
          <div className="mt-4 animate-[fadeIn_.35s_ease] rounded-[12px] border border-orange/50 bg-orange/10 p-4">
            <div className="font-disp text-[12px] font-semibold uppercase tracking-[1.4px] text-orange">How you beat it</div>
            <p className="mt-1 text-[15px] text-off">
              Pick one niche to test. Depth reads as authority in a way breadth never does.
            </p>
            <button onClick={() => setBeaten(false)} className="mt-3 text-[13px] font-semibold text-blue">
              Play again
            </button>
          </div>
        )}
      </div>
      <p className="mt-3 text-[13px] text-sec">Every chapter has one. You always know what you’re up against.</p>
    </div>
  );
}

function ListDemo() {
  const [added, setAdded] = useState<string[]>([]);
  const next = NAMES[added.length];
  const pts = added.length * 10;
  return (
    <div>
      <div className="flex items-center justify-between text-[12.5px] text-sec">
        <span className="font-disp font-semibold text-off">Your contact list</span>
        <span>
          <b className="text-orange">{added.length}</b> of 250 · <b className="text-orange">{pts}</b> points
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-orange transition-all duration-500" style={{ width: `${Math.max(2, (added.length / 250) * 100 * 10)}%` }} />
      </div>
      <p className="mt-3 text-[13.5px] leading-relaxed text-sec">
        The people who will hear about your coaching first. The method builds it toward 250 names, and every
        name earns 10 points.
      </p>
      <ul className="mt-3 space-y-2">
        {added.map((n) => (
          <li key={n} className="flex animate-[fadeIn_.3s_ease] items-center justify-between rounded-[10px] bg-white/5 px-3 py-2 text-[14px] text-off">
            {n} <span className="text-[12px] font-semibold text-orange">+10</span>
          </li>
        ))}
      </ul>
      {next ? (
        <button onClick={() => setAdded((a) => [...a, next])} className="mt-3 w-full rounded-[12px] border border-dashed border-orange/60 py-3 font-disp text-[14px] font-semibold text-orange transition hover:bg-orange/10">
          + Add “{next}”
        </button>
      ) : (
        <div className="mt-3 animate-[fadeIn_.35s_ease] rounded-[12px] border border-orange/50 bg-orange/10 p-3 text-[14px] text-off">
          Five names, 50 points. Build Free holds 50 names. <b>Build has no limit</b>, so you can reach all 250.
          <button onClick={() => setAdded([])} className="ml-2 text-[13px] font-semibold text-blue">Play again</button>
        </div>
      )}
    </div>
  );
}
