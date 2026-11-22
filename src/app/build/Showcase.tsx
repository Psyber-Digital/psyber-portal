"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Scroll-driven pieces and the "inside every session" showcase for the public
// Build page (Don, card N1, 22 Nov 2026: "have more visual demonstrations too -
// i.e. working sheet, principle sheet ETC. Also, more interactivity on the page
// itself as they scroll down"). Text in the sheet and card demos is copied from
// Session 1's real Working Sheet and Principle Card (public/session-01/).
// Nothing is saved.

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return setShown(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Counts up to a number when it scrolls into view. */
export function CountUp({ to, className = "" }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const run = () => {
      const start = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - start) / 1200);
        setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    if (!("IntersectionObserver" in window)) {
      setN(to);
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        run();
        io.disconnect();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return (
    <span ref={ref} className={className}>
      {n}
    </span>
  );
}

// From Session 1's Working Sheet, beliefs menu.
const BELIEFS = [
  {
    name: "Fixed → growth",
    sounds: "I have never coached anyone. I will be terrible at it.",
    truer: "I have spent years helping people change. It is in my training and my experience. I am well placed to coach.",
  },
  {
    name: "Unworthy → capable",
    sounds: "Somebody better could do this.",
    truer: "Nobody has my life experiences, background or style. Nobody can deliver this program the way I can.",
  },
  {
    name: "Scarcity → abundance",
    sounds: "There cannot be enough people who would pay for this.",
    truer: "There are more people who need this than I could ever serve. I only need a few of them.",
  },
];

// From Session 1's Principle Card, the seven shifts.
const SHIFTS = [
  ["Charge by time", "Charge by value", "The hour is not the product. The change is the product, and the change is what carries a price."],
  ["You're right", "The market is right", "You cannot make people want something. You can find what they already want, and build for that."],
  ["Quit by feeling", "Adapt by feedback", "Motivation rises and falls every week. Decisions get made on what the market actually did."],
] as const;

type Tab = "sheet" | "card" | "video";

export function SessionShowcase() {
  const [tab, setTab] = useState<Tab>("sheet");
  return (
    <div>
      <div className="mx-auto flex max-w-[520px] gap-2 rounded-full bg-white/5 p-1">
        {(
          [
            ["video", "Session video"],
            ["sheet", "Working Sheet"],
            ["card", "Principle Card"],
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
      <div className="mt-6 min-h-[260px]">
        {tab === "sheet" && <SheetDemo />}
        {tab === "card" && <CardDemo />}
        {tab === "video" && <VideoDemo />}
      </div>
      <style>{"@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}"}</style>
    </div>
  );
}

function SheetDemo() {
  const [picked, setPicked] = useState<number[]>([]);
  const toggle = (i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  return (
    <div className="mx-auto max-w-[720px] rounded-[18px] bg-[#F7F3EC] p-5 text-[#1d2433] shadow-2xl sm:p-7">
      <div className="font-disp text-[11px] font-semibold uppercase tracking-[1.6px] text-[#b4621a]">Session 1 · Working Sheet</div>
      <div className="mt-1 font-disp text-[20px] font-semibold">01 · The beliefs that will slow you down</div>
      <p className="mt-1 text-[13.5px] text-[#5b6478]">Tap the ones that sound like you. Each comes with something truer.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {BELIEFS.map((b, i) => (
          <button
            key={b.name}
            onClick={() => toggle(i)}
            className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold transition ${
              picked.includes(i) ? "border-[#e8780f] bg-[#e8780f] text-white" : "border-[#d8cfbf] bg-white text-[#1d2433] hover:border-[#e8780f]"
            }`}
          >
            {picked.includes(i) ? "✓ " : "+ "}
            {b.name}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {picked.length === 0 && (
          <div className="rounded-[12px] border border-dashed border-[#d8cfbf] p-4 text-center text-[13.5px] text-[#8a92a3]">
            Your rows appear here.
          </div>
        )}
        {picked.map((i) => (
          <div key={i} className="grid animate-[fadeIn_.35s_ease] gap-2 rounded-[12px] bg-white p-4 sm:grid-cols-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#8a92a3]">The belief</div>
              <div className="mt-0.5 text-[14px] italic">“{BELIEFS[i].sounds}”</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#b4621a]">Something truer</div>
              <div className="mt-0.5 text-[14px]">{BELIEFS[i].truer}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardDemo() {
  const [flipped, setFlipped] = useState<number | null>(null);
  return (
    <div className="mx-auto max-w-[720px]">
      <p className="mb-4 text-center text-[14px] text-sec">Every session comes with a Principle Card. Tap one to see why it matters.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {SHIFTS.map(([from, to, why], i) => (
          <button
            key={from}
            onClick={() => setFlipped(flipped === i ? null : i)}
            className={`min-h-[170px] rounded-[16px] border p-5 text-left transition duration-300 hover:-translate-y-1 ${
              flipped === i ? "border-orange bg-orange/15" : "border-line bg-[#121B2E]"
            }`}
          >
            {flipped === i ? (
              <span className="block animate-[fadeIn_.3s_ease]">
                <span className="block font-disp text-[15px] font-semibold text-orange">{to}</span>
                <span className="mt-2 block text-[13.5px] leading-relaxed text-sec">{why}</span>
              </span>
            ) : (
              <span className="block">
                <span className="block text-[13px] text-slate line-through">{from}</span>
                <span className="mt-1 block font-disp text-[20px] font-semibold text-off">→ {to}</span>
                <span className="mt-4 block text-[12px] font-semibold text-blue">Tap to see why</span>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function VideoDemo() {
  return (
    <div className="mx-auto max-w-[720px]">
      <div className="relative overflow-hidden rounded-[18px] border border-line bg-[linear-gradient(135deg,#121B2E,#0B1220)] p-8 text-center shadow-2xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange/20 blur-2xl" />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange/20 text-[28px]">🎬</div>
        <div className="mt-4 font-disp text-[13px] font-semibold uppercase tracking-[1.6px] text-orange">Session 1 · the video</div>
        <div className="mt-1 font-disp text-[24px] font-semibold text-off">Foundations: clear the road</div>
        <p className="mx-auto mt-2 max-w-[440px] text-[14.5px] text-sec">
          What could derail you on the way to becoming a successful coach? Name it now, plan for it, and set
          your first step.
        </p>
      </div>
    </div>
  );
}
