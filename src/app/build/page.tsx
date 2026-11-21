import Image from "next/image";
import { buildOnSale, OPENS_SOON } from "@/lib/sale";
import Link from "next/link";
import { VimeoEmbed } from "@/app/portal/components/VimeoEmbed";
import type { WeekVideo } from "@/lib/videos";
import { Brand } from "@/app/portal/components/Brand";

// Public Build landing page, for people who said at call booking that they'd
// rather have a roadmap, resources and drop-ins than one-on-one support (Don,
// Emails m35, 30 Oct). Sold to Codex VOICE-20261030-1 and -2. Framed to Codex
// VOICE-20261031-1 (go it alone, and avoid the pitfalls; Don, m41, 31 Oct). Facts must match the Build terms.
//
// The video is made by Audit (board m41/m42, approved by Don on bv3, 5 Nov).
// Its Vimeo embed is locked to the portal domains. If BUILD_VIDEO is set back
// to null, the page shows a still panel in its place.
const BUILD_VIDEO: WeekVideo | null = { id: "1243971172", hash: "ed44b8a740", title: "Introducing Build™" };

const STRATEGY_CALL_URL = "https://calendly.com/psyberdigital/coaching-application";

export const metadata = {
  title: "Build™ · Psyber Digital",
  description:
    "Launch your coaching program on your own, without the pitfalls. Every session, every resource, a live drop-in each week, and Next Move to show you one clear step at a time.",
};

// Next Move, the way Build works inside (Don: d3, 21 Nov 2026). Each line is
// true of the portal today; see the comment above NEXT_MOVE's section.
const NEXT_MOVE: [string, string][] = [
  ["One move at a time", "Open the portal and your next move is right there, front and center. Do it, tick it, and the next one is already waiting. You always know what tonight's job is."],
  ["Your program, as a story", "Each session is a chapter, and you're the hero. Every chapter names the one obstacle most likely to stop you, and shows you how to beat it."],
  ["Progress you can see", "Moves earn points, and so does every name you add and every message you send. Every chapter you finish is a level up, with badges along the way. You always know how far you've come."],
  ["Follow-ups on the right day", "When someone on your contact list is due for a follow-up, they show up under Due today, on the day they're due."],
];

// Each line answers one pitfall of going it alone (Codex VOICE-20261031-1).
const INCLUDED = [
  "A clear first step and a proven roadmap, so you know where to start",
  "Every session, each with its video, Working Sheet and Principle Card",
  "Next Move: the right step waiting each time you log in, from your first evening to a program that's ready to sell",
  "Each session opens as you finish the one before, so you only work on what matters next",
  "A live group drop-in every week, for help before a wrong turn costs you weeks",
  "Go as fast as your week allows",
];

export default function BuildPage() {
  return (
    <main className="relative z-10 mx-auto w-full max-w-[880px] px-5 pb-20 pt-10">
      <div className="mb-10 flex justify-center">
        <Image src="/wordmark.png" alt="Psyber Digital" width={240} height={46} priority className="h-10 w-auto" />
      </div>

      <section className="text-center">
        <div className="psy-eyebrow text-sec">Introducing <Brand name="Build" tm />, with Next Move</div>
        <h1 className="mx-auto mt-2 max-w-[640px] font-disp text-3xl font-semibold leading-tight text-off sm:text-4xl">
          Launch your coaching program on your own, without the pitfalls
        </h1>
        <p className="mx-auto mt-4 max-w-[600px] text-[15px] leading-relaxed text-slate">
          Some people want to do it themselves, at their own pace. They don’t need constant
          support. But going it alone has its pitfalls: not knowing where to
          start, too much information, months spent on the wrong thing. We
          designed <Brand name="Build" /> so you can go it alone and avoid them.
        </p>
      </section>

      {/* Next Move leads (Don, 21 Nov 2026). */}
      <section className="mt-10 overflow-hidden rounded-[20px] border-2 border-orange/60 bg-[linear-gradient(160deg,rgba(255,141,30,0.16),rgba(255,141,30,0.03))] p-6 sm:p-9">
        <div className="psy-eyebrow text-orange">New: Next Move</div>
        <h2 className="mt-2 max-w-[620px] font-disp text-[26px] font-semibold leading-tight text-off sm:text-[32px]">
          Never wonder what to do next
        </h2>
        <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-sec">
          A pile of videos leaves you to work out the order yourself. <Brand name="Build" /> doesn’t.
          Next Move turns the whole program into one clear step at a time, so every evening you sit down,
          you know exactly what to do.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {NEXT_MOVE.map(([t, d]) => (
            <div key={t} className="rounded-[14px] border border-line bg-[#0B1220]/60 p-5">
              <h3 className="font-disp text-[16px] font-semibold text-off">{t}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-sec">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-9">
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

      <section className="mt-10 grid gap-6 md:grid-cols-[1fr_300px] md:gap-8">
        <div className="psy-card p-6 sm:p-8">
          <h2 className="font-disp text-xl font-semibold text-off">What you get</h2>
          <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-sec">
            {INCLUDED.map((b) => (
              <li key={b} className="flex gap-2.5">
                <span className="mt-[3px] text-blue">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="psy-card flex flex-col gap-4 p-6">
          <div>
            <div className="psy-eyebrow text-blue">Monthly</div>
            <div className="mt-1 font-disp text-2xl font-semibold text-off">$97 a month</div>
          </div>
          <div>
            <div className="psy-eyebrow text-blue">Yearly</div>
            <div className="mt-1 font-disp text-2xl font-semibold text-off">$997 a year</div>
            <p className="mt-1 text-xs text-slate">Saves you $167 a year.</p>
            <p className="mt-2 rounded-[9px] border border-orange/30 bg-orange/[0.08] px-3 py-2 text-xs leading-relaxed text-sec">
              {buildOnSale() ? (
                <>
                  Start with <Brand name="Foundations" />, then upgrade within 7 days of signing up for
                  $300 off your first year on the yearly plan. After that, the saving drops by $100 a week.
                </>
              ) : (
                <>
                  Start with <Brand name="Foundations" /> now. When <Brand name="Build" /> opens, you get
                  $300 off your first year on the yearly plan if you upgrade within 7 days.
                </>
              )}
            </p>
          </div>
          {buildOnSale() ? (
            <Link href="/join?plan=build" className="psy-btn mt-2 w-full justify-center">
              Join Build™
            </Link>
          ) : (
            <p className="mt-2 rounded-[9px] border border-blue/30 bg-blue/10 px-3 py-2.5 text-sm text-sec">{OPENS_SOON}</p>
          )}
          {/* Renewal and refund terms beside the button (terms 3.2, 4.1-4.4). */}
          <p className="text-xs leading-relaxed text-slate">
            Renews automatically until you cancel. Monthly: cancel any time, no
            refunds. Yearly: a full refund within 14 days of paying.
          </p>
          {/* The free way in (Don, 5 Nov 2026, board m03 and m04). */}
          <div className="border-t border-line pt-4">
            <p className="text-sm leading-relaxed text-slate">
              Not ready yet? Start with <Brand name="Foundations" />, your first tangible step:
              Session 1, and a contact list for up to 50 names. The weekly drop-ins come
              with full <Brand name="Build" />.
            </p>
            <Link href="/join" className="psy-btn-ghost mt-3 block w-full text-center">
              Try Build™ for free
            </Link>
          </div>
        </div>
      </section>

      <p className="mt-8 text-center text-sm font-semibold text-off">
        Every week you wait is another week your program isn’t for sale.
      </p>

      <p className="mt-8 text-center text-sm text-slate">
        Want us beside you the whole way?{" "}
        <a href={STRATEGY_CALL_URL} target="_blank" rel="noopener" className="font-semibold text-blue">
          Book a call about one-on-one support
        </a>
      </p>
    </main>
  );
}
