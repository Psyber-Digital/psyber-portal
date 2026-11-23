import Image from "next/image";
import { buildOnSale } from "@/lib/sale";
import Link from "next/link";
import { VimeoEmbed } from "@/app/portal/components/VimeoEmbed";
import type { WeekVideo } from "@/lib/videos";
import { Brand } from "@/app/portal/components/Brand";
import { BuildDemo } from "./BuildDemo";
import { CountUp, Reveal, SessionShowcase } from "./Showcase";

// Public Build landing page. Rebuilt 22 Nov 2026 to Don's note on card N1:
// "Don't talk about what it doesn't do ... make it sound revolutionary - a
// method we've designed to supercharge their progress, productivity. Make it
// exciting ... I also don't want long passages of text. Clarity. Simplicity.
// Influence." Sold to Codex VOICE-20261030-1 (bold, but only true claims).
// Facts must match the Build terms and the portal code:
//   one move at a time ............ lib/moves.ts, components/NextMove.tsx
//   chapters with an obstacle ...... lib/story.ts
//   points, levels, badges ......... lib/points.ts, lib/milestones.ts
//   follow-ups under Due today ..... lib/dueMoves.ts
//   7 sessions, weekly drop-in ..... terms 2.1, 2.3
// The playable demo (BuildDemo.tsx) uses real Session 2 moves, points and the
// chapter 2 villain.
//
// The video is made by Audit (board m41/m42, approved by Don on bv3, 5 Nov).
// Its Vimeo embed is locked to the portal domains.
const BUILD_VIDEO: WeekVideo | null = { id: "1243971172", hash: "ed44b8a740", title: "Introducing Build™" };

const STRATEGY_CALL_URL = "https://calendly.com/psyberdigital/coaching-application";

// Read the sale switch on every visit, so turning Build on sale on Friday
// changes this page without a redeploy (portal-qa, 22 Nov 2026).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Build™ · Psyber Digital",
  description:
    "Launch your coaching program, one move at a time. Build runs on Next Move, a method designed to supercharge your progress.",
};

// Short on purpose (Don: "I don't want long passages of text").
const POWERS: [string, string][] = [
  ["One move at a time", "Open the portal. Your next move is waiting."],
  ["Your launch, as a story", "You're the hero. Each chapter names the villain in your way, like The Wide Net, and how to beat it."],
  ["Points, levels and badges", "The most points go to messages sent and calls booked."],
  ["Follow-ups on time", "The portal shows who to follow up with, and when."],
];

const INCLUDED = [
  "All 7 sessions, each with its video, Working Sheet and Principle Card",
  "Next Move, guiding every step",
  "A live group drop-in every week",
  "Room for your whole contact list: the people who’ll hear you’re coaching first (free holds 50)",
  "Go as fast as your week allows",
];

function Dot({ n }: { n: number }) {
  return (
    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-orange font-disp text-[14px] font-bold text-[#1a0d00]">
      {n}
    </span>
  );
}

export default function BuildPage() {
  const onSale = buildOnSale();
  return (
    <main className="relative z-10 mx-auto w-full max-w-[960px] overflow-x-clip px-5 pb-20 pt-10">
      <div className="mb-10 flex justify-center">
        <Image src="/wordmark.png" alt="Psyber Digital" width={240} height={46} priority className="h-10 w-auto" />
      </div>

      {/* Hero */}
      <section className="text-center">
        <div className="psy-eyebrow text-orange">Introducing <Brand name="Build" tm /></div>
        <h1 className="mx-auto mt-3 max-w-[720px] font-disp text-[34px] font-semibold leading-[1.1] text-off sm:text-[52px]">
          Launch your coaching program.{" "}
          <span className="bg-[linear-gradient(90deg,#FFA54A,#FF8D1E)] bg-clip-text text-transparent">One move at a time.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-relaxed text-sec">
          Go it alone, and never get stuck. <Brand name="Build" /> runs on Next Move, a method we designed to supercharge your progress.
        </p>
        <div className="mx-auto mt-7 flex max-w-[460px] flex-col gap-3 sm:flex-row">
          <Link href="/join" className="psy-btn flex-1 justify-center py-3.5 text-[15px]">
            Try Build™ for free
          </Link>
          <a href="#next-move" className="psy-btn-ghost flex-1 py-3.5 text-center text-[15px]">
            See how it works
          </a>
        </div>
        <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-orange/40 bg-orange/10 px-4 py-1.5 text-[13px] text-off">
          <span className="h-2 w-2 animate-pulse rounded-full bg-orange" />
          {onSale
            ? "New members: $300 off your first year if you upgrade within 7 days."
            : "Start free today. $300 off your first year when Build™ opens."}
        </p>
      </section>

      {/* Three promises, in Don's words (N1 note, 22 Nov 2026). */}
      <Reveal>
      <section className="mt-14 grid gap-3 sm:grid-cols-3">
        {[
          ["🧭", "Don’t get stuck.", "Always know what to do next."],
          ["📦", "Everything in one place.", "All the resources you need, packaged in Next Move."],
          ["🎯", "Progress becomes fun.", "Your moves score points. Every chapter levels you up."],
        ].map(([icon, h, t]) => (
          <div key={h} className="rounded-[18px] border border-orange/30 bg-[linear-gradient(160deg,rgba(255,141,30,0.12),rgba(255,141,30,0.02))] p-5 text-center">
            <div className="text-[30px]">{icon}</div>
            <div className="mt-2 font-disp text-[19px] font-semibold text-off">{h}</div>
            <div className="mt-1 text-[14px] leading-relaxed text-sec">{t}</div>
          </div>
        ))}
      </section>
      </Reveal>

      {/* Next Move */}
      <Reveal>
      <section id="next-move" className="mt-16 grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
        {/* Playable, like the Quranic Family site (Don, N1, 22 Nov 2026). */}
        <BuildDemo />

        <div>
          <div className="psy-eyebrow text-orange">The method</div>
          <h2 className="mt-2 font-disp text-[30px] font-semibold leading-tight text-off sm:text-[38px]">
            Meet Next Move
          </h2>
          <p className="mt-2 text-[17px] leading-relaxed text-sec">
            One clear move at a time, each one opening exactly what it needs. Tap the demo and play.
          </p>
          <ul className="mt-6 space-y-4">
            {POWERS.map(([t, d], i) => (
              <li key={t} className="flex items-start gap-3.5">
                <Dot n={i + 1} />
                <span>
                  <span className="block font-disp text-[16px] font-semibold text-off">{t}</span>
                  <span className="text-[14.5px] text-sec">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      </Reveal>

      {/* Why Build exists (Don, Y1 note, 23 Nov 2026). */}
      <Reveal>
      <section className="mt-20">
        <div className="text-center">
          <div className="psy-eyebrow text-orange">Why Build exists</div>
          <h2 className="mx-auto mt-2 max-w-[640px] font-disp text-[28px] font-semibold leading-tight text-off sm:text-[36px]">
            Go it alone, without the pitfalls. That’s what we built <Brand name="Build" /> for.
          </h2>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            ["Not knowing where to start", "A clear place to start, and the whole road to launch mapped out."],
            ["Too much information", "You see only what matters now, one session at a time."],
            ["Months on the wrong thing", "Bring it to the live drop-in. Catch a wrong turn within a week, not months later."],
            ["Quietly stalling in a busy month", "Pick up exactly where you left off. The drop-in gets you going again."],
          ].map(([danger, fix]) => (
            <div key={danger} className="rounded-[16px] border border-line bg-[#121B2E] p-5">
              <div className="text-[13px] font-semibold text-slate line-through decoration-orange/70">{danger}</div>
              <div className="mt-1.5 font-disp text-[17px] font-semibold leading-snug text-off">{fix}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-[22px] border-2 border-blue bg-[linear-gradient(160deg,rgba(30,144,255,0.18),rgba(30,144,255,0.03))] p-7 sm:flex sm:items-center sm:gap-8 sm:p-9">
          <div className="text-[52px] leading-none">🎥</div>
          <div className="mt-4 sm:mt-0">
            <div className="psy-eyebrow text-blue">The weekly drop-in</div>
            <h3 className="mt-1 font-disp text-[24px] font-semibold leading-tight text-off sm:text-[28px]">
              Live help with your next decision, every week.
            </h3>
            <p className="mt-2 max-w-[560px] text-[15px] leading-relaxed text-sec">
              Every week, live on video. Bring your next decision: the niche you’re torn on, the price
              you’re unsure of, the message you’re about to send. Leave knowing your next move. Missed it?
              The recording waits in your portal for 90 days.
            </p>
          </div>
        </div>
      </section>
      </Reveal>

      {/* Three facts, counting up as they scroll in. */}
      <Reveal>
      <section className="mt-16 grid grid-cols-3 gap-3 text-center">
        {[
          ["7", "sessions"],
          ["1", "live drop-in every week"],
          ["250", "people you’ll tell you’re coaching"],
        ].map(([n, l]) => (
          <div key={l} className="psy-card px-2 py-5">
            <div className={`font-disp font-semibold leading-tight text-orange ${n.length > 2 ? "text-[22px] sm:text-[34px]" : "text-[34px] sm:text-[44px]"}`}><CountUp to={Number(n)} /></div>
            <div className="mt-1 text-[12.5px] leading-snug text-sec sm:text-[14px]">{l}</div>
          </div>
        ))}
      </section>
      </Reveal>

      {/* Inside every session: the sheet and card you can play with (Don, N1, 22 Nov). */}
      <Reveal>
      <section className="mt-20 text-center">
        <div className="psy-eyebrow text-orange">Inside every session</div>
        <h2 className="mt-2 font-disp text-[28px] font-semibold leading-tight text-off sm:text-[36px]">
          Watch it. Work it. Keep it.
        </h2>
        <p className="mx-auto mt-2 max-w-[520px] text-[16px] text-sec">
          A short video, a Working Sheet that turns it into your decisions, and a Principle Card. Try two of them.
        </p>
        <div className="mt-8 text-left">
          <SessionShowcase />
        </div>
      </section>
      </Reveal>

      <section className="mt-14">
        {BUILD_VIDEO ? (
          <VimeoEmbed video={BUILD_VIDEO} title="Introducing Build™" />
        ) : (
          <div
            className="relative flex w-full items-center justify-center overflow-hidden rounded-[12px] border border-line bg-white/[0.02]"
            style={{ paddingTop: "56.25%" }}
          >
            <span className="absolute inset-0 flex items-center justify-center font-disp text-lg text-sec">
              Introducing&nbsp;<Brand name="Build" />
            </span>
          </div>
        )}
      </section>

      {/* What you get and the price */}
      <Reveal>
      <section className="mt-14 grid items-start gap-6 md:grid-cols-[1fr_320px] md:gap-8">
        <div className="psy-card p-6 sm:p-8">
          <h2 className="font-disp text-[22px] font-semibold text-off">What you get</h2>
          <ul className="mt-5 space-y-3.5 text-[16px] text-sec">
            {INCLUDED.map((b) => (
              <li key={b} className="flex gap-3">
                <span className="text-orange">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="psy-card flex flex-col gap-4 p-6">
          <div>
            <div className="psy-eyebrow text-blue">Build™ · yearly</div>
            <div className="mt-1 font-disp text-[30px] font-semibold leading-none text-off">
              $997 <span className="text-[15px] font-normal text-slate">a year</span>
            </div>
            <p className="mt-1 text-[12.5px] text-slate">Under $84 a month, paid once a year.</p>
          </div>
          <p className="rounded-[9px] border border-orange/40 bg-orange/[0.1] px-3 py-2.5 text-[13px] leading-relaxed text-off">
            {onSale ? (
              <>New members: start free, then upgrade within 7 days: <b>$300 off</b> your first year. It drops every week after.</>
            ) : (
              <>New members: start free now. When <Brand name="Build" /> opens, upgrade within 7 days: <b>$300 off</b> your first year, dropping every week after.</>
            )}
          </p>
          <Link href="/join" className="psy-btn w-full justify-center py-3">
            Try Build™ for free
          </Link>
          {onSale ? (
            <Link href="/join?plan=build" className="psy-btn-ghost block w-full text-center">
              Join Build™ now
            </Link>
          ) : null}
          {/* What the free plan is, plainly (Don, 21 Nov 2026: no drop-ins). */}
          <p className="text-[12.5px] leading-relaxed text-slate">
            Free: Session 1, and a contact list for up to 50 names. Drop-ins come with full <Brand name="Build" />.
          </p>
          {/* Renewal and refund terms beside the buttons (terms 3.2, 4.1-4.4). */}
          <p className="text-[12px] leading-relaxed text-slate">
            Renews automatically each year until you cancel. A full refund within 14 days of paying.
          </p>
        </div>
      </section>

      </Reveal>

      <Reveal>
      <section className="mt-16 overflow-hidden rounded-[24px] border border-[#ffb36b] bg-[linear-gradient(135deg,#FFA54A,#E8780F)] p-8 text-center text-[#1a0d00] sm:p-12">
        <h2 className="mx-auto max-w-[620px] font-disp text-[28px] font-semibold leading-tight sm:text-[38px]">
          Every week you wait is another week your program isn’t for sale.
        </h2>
        <p className="mt-3 text-[16px]">Make your first move tonight.</p>
        <Link href="/join" className="mt-6 inline-block rounded-[14px] bg-[#0B1220] px-8 py-4 font-disp text-[16px] font-semibold text-white transition hover:scale-[1.03]">
          Try Build™ for free
        </Link>
      </section>
      </Reveal>

      <Reveal>
      <section className="mt-6 rounded-[22px] border-2 border-blue bg-[linear-gradient(160deg,rgba(30,144,255,0.16),rgba(30,144,255,0.03))] p-7 sm:flex sm:items-center sm:justify-between sm:gap-8">
        <div>
          <div className="psy-eyebrow text-blue">One-on-one support</div>
          <h2 className="mt-1 font-disp text-[24px] font-semibold text-off">Want full support?</h2>
          <p className="mt-1 max-w-[520px] text-[14.5px] leading-relaxed text-sec">
            Launch your coaching program with us beside you. Seven one-on-one sessions and three clinics, with
            personal feedback on your niche, message, offer and program.
          </p>
        </div>
        <a href={STRATEGY_CALL_URL} target="_blank" rel="noopener" className="psy-btn mt-5 block shrink-0 text-center sm:mt-0">
          Book a call
        </a>
      </section>
      </Reveal>

      {/* Always one tap away on a phone. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[#0B1220]/95 p-3 backdrop-blur sm:hidden">
        <Link href="/join" className="psy-btn block w-full text-center">
          Try Build™ for free
        </Link>
      </div>
      <div className="h-16 sm:hidden" aria-hidden />
    </main>
  );
}
