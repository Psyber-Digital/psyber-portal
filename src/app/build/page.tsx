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
  ["One move at a time", "Open the portal, see exactly what to do."],
  ["Your program, as a story", "Each chapter names the villain in your way, and how to beat it."],
  ["Points, levels and badges", "Most points for the moves that win clients."],
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
          Go it alone, without the pitfalls. <Brand name="Build" /> runs on Next Move, a method we designed to supercharge your progress.
        </p>
        <div className="mx-auto mt-7 flex max-w-[460px] flex-col gap-3 sm:flex-row">
          <Link href="/join" className="psy-btn flex-1 justify-center py-3.5 text-[15px]">
            Try Build™ for free
          </Link>
          <a href="#next-move" className="psy-btn-ghost flex-1 py-3.5 text-center text-[15px]">
            See how it works
          </a>
        </div>
      </section>

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
            Building your program becomes a game. Every move scores. Tap the demo and play.
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

      {/* Three facts, counting up as they scroll in. */}
      <Reveal>
      <section className="mt-16 grid grid-cols-3 gap-3 text-center">
        {[
          ["7", "sessions"],
          ["1", "live drop-in every week"],
          ["250", "people who’ll hear you’re coaching"],
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
          A short video, a Working Sheet that turns it into your decisions, and a Principle Card to keep. Try them.
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
          <div className="flex items-end justify-between">
            <div>
              <div className="psy-eyebrow text-blue">Yearly</div>
              <div className="mt-1 font-disp text-[30px] font-semibold leading-none text-off">$997</div>
            </div>
            <div className="text-right">
              <div className="psy-eyebrow text-blue">Monthly</div>
              <div className="mt-1 font-disp text-[22px] font-semibold leading-none text-off">$97</div>
            </div>
          </div>
          <p className="rounded-[9px] border border-orange/40 bg-orange/[0.1] px-3 py-2.5 text-[13px] leading-relaxed text-off">
            {onSale ? (
              <>New members: start free, then upgrade within 7 days: <b>$300 off</b> your first year on the yearly plan. It drops every week after.</>
            ) : (
              <>New members: start free now. When <Brand name="Build" /> opens, upgrade within 7 days: <b>$300 off</b> your first year on the yearly plan, dropping every week after.</>
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
            Renews automatically until you cancel. Monthly: cancel any time, no refunds. Yearly: a full
            refund within 14 days of paying.
          </p>
        </div>
      </section>

      </Reveal>

      <p className="mt-12 text-center font-disp text-[18px] font-semibold text-off">
        Every week you wait is another week your program isn’t for sale.
      </p>

      <p className="mt-6 text-center text-sm text-slate">
        Want us beside you the whole way?{" "}
        <a href={STRATEGY_CALL_URL} target="_blank" rel="noopener" className="font-semibold text-blue">
          Book a call about one-on-one support
        </a>
      </p>
    </main>
  );
}
