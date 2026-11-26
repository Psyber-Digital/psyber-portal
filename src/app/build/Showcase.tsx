"use client";

import { Brand } from "@/app/portal/components/Brand";

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
  // Starts at the real number, so the page shows it before scripts run (and to
  // search engines); drops to 0 only to count up once it scrolls into view.
  const [n, setN] = useState(to);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.getBoundingClientRect().top > window.innerHeight) setN(0);
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
  // Embellished (Don, 26 Nov 2026: "a bit bland - embellish it"): a coloured
  // header, a flip counter with points, and each row drawn as a flip from the
  // old belief to the truer one. The sheet's own words are unchanged.
  const [picked, setPicked] = useState<number[]>([]);
  const toggle = (i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  const all = picked.length === BELIEFS.length;
  return (
    <div className="mx-auto max-w-[720px] overflow-hidden rounded-[20px] bg-[#F7F3EC] text-[#1d2433] shadow-2xl ring-1 ring-[#e8780f]/30">
      <div className="relative bg-[linear-gradient(120deg,#FFA54A,#E8780F)] px-5 py-4 text-[#241100] sm:px-7">
        <svg className="absolute -right-4 -top-6 h-28 w-28 opacity-20" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.3 6.8 19l1-5.8L3.5 9.2l5.9-.9z" fill="currentColor" />
        </svg>
        <div className="flex items-center justify-between gap-3">
          <div className="font-disp text-[11px] font-bold uppercase tracking-[1.6px]">Session 1 · Working Sheet</div>
          <span className="rounded-full bg-[#241100]/85 px-2.5 py-0.5 font-disp text-[12px] font-bold text-[#FFD29E]">
            +{picked.length * 5} points
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2.5 font-disp text-[20px] font-semibold sm:text-[22px]">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-[#241100] text-[14px] font-bold text-[#FFA54A]">01</span>
          The beliefs that will slow you down
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <p className="text-[13.5px] text-[#5b6478]">Tap the ones that sound like you. Each comes with something truer.</p>

        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8dfd0]">
            <i
              className="block h-full rounded-full bg-[linear-gradient(90deg,#FF8D1E,#1E90FF)] transition-[width] duration-500"
              style={{ width: `${(picked.length / BELIEFS.length) * 100}%` }}
            />
          </div>
          <span className="flex-none font-disp text-[12.5px] font-semibold text-[#b4621a]">
            {picked.length} of {BELIEFS.length}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {BELIEFS.map((b, i) => (
            <button
              key={b.name}
              onClick={() => toggle(i)}
              className={`rounded-full border-2 px-3.5 py-1.5 text-[13px] font-semibold shadow-sm transition ${
                picked.includes(i)
                  ? "border-[#e8780f] bg-[linear-gradient(120deg,#FFA54A,#E8780F)] text-[#241100]"
                  : "border-[#e6d9c4] bg-white text-[#1d2433] hover:-translate-y-0.5 hover:border-[#e8780f]"
              }`}
            >
              {picked.includes(i) ? "✓ " : "+ "}
              {b.name}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {picked.length === 0 && (
            <div className="flex items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-[#e6d9c4] p-5 text-center text-[13.5px] text-[#8a92a3]">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Your rows appear here.
            </div>
          )}
          {picked.map((i) => (
            <div
              key={i}
              className="grid animate-[fadeIn_.35s_ease] items-stretch gap-2 rounded-[14px] bg-white p-3 shadow-sm ring-1 ring-[#efe6d6] sm:grid-cols-[1fr_auto_1fr] sm:p-4"
            >
              <div className="rounded-[10px] bg-[#f3eee6] p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#8a92a3]">The belief</div>
                <div className="mt-0.5 text-[14px] italic text-[#5b6478] line-through decoration-[#e8780f]/50">“{BELIEFS[i].sounds}”</div>
              </div>
              <div className="grid place-items-center text-[#e8780f]" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="26" height="26" className="rotate-90 sm:rotate-0">
                  <path d="M5 12h12M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="rounded-[10px] border-l-4 border-[#e8780f] bg-[#fff6ec] p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[1px] text-[#b4621a]">Something truer</div>
                <div className="mt-0.5 text-[14px] font-medium">{BELIEFS[i].truer}</div>
              </div>
            </div>
          ))}
        </div>

        {all && (
          <div className="mt-4 animate-[fadeIn_.35s_ease] rounded-[14px] bg-[#13281c] px-4 py-3 text-center font-disp text-[14.5px] font-semibold text-[#9be7b0]">
            ✓ All three flipped! That&rsquo;s +15 points in <Brand name="Build" tm />.
          </div>
        )}
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
