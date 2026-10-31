import Image from "next/image";
import Link from "next/link";
import { VimeoEmbed } from "@/app/portal/components/VimeoEmbed";
import type { WeekVideo } from "@/lib/videos";
import { Brand } from "@/app/portal/components/Brand";

// Public Build landing page, for people who said at call booking that they'd
// rather have a roadmap, resources and drop-ins than one-on-one support (Don,
// Emails m35, 30 Oct). Sold to Codex VOICE-20261030-1 and -2. Wording reuses
// the approved pay page (board r35). Facts must match the Build terms.
//
// The video is made by Audit (board m41/m42). Until it is published, the page
// shows a still panel in its place. Set BUILD_VIDEO to the Vimeo id and hash.
const BUILD_VIDEO: WeekVideo | null = null;

const STRATEGY_CALL_URL = "https://calendly.com/psyberdigital/coaching-application";

export const metadata = {
  title: "Build™ · Psyber Digital",
  description:
    "Launch your coaching program at your own pace. Every session and all its resources, plus a live drop-in every week.",
};

const INCLUDED = [
  "Every session, each with its video, Working Sheet and Principle Card",
  "A live group drop-in every week, for help with whatever you need",
  "Each session opens as you finish the one before, so your next step is always clear",
  "Go as fast as your week allows",
];

export default function BuildPage() {
  return (
    <main className="relative z-10 mx-auto w-full max-w-[880px] px-5 pb-20 pt-10">
      <div className="mb-10 flex justify-center">
        <Image src="/wordmark.png" alt="Psyber Digital" width={240} height={46} priority className="h-10 w-auto" />
      </div>

      <section className="text-center">
        <div className="psy-eyebrow text-sec">Introducing <Brand name="Build" tm /></div>
        <h1 className="mx-auto mt-2 max-w-[640px] font-disp text-3xl font-semibold leading-tight text-off sm:text-4xl">
          Launch your coaching program at your own pace
        </h1>
        <p className="mx-auto mt-4 max-w-[600px] text-[15px] leading-relaxed text-slate">
          You get every resource for the job, plus a weekly drop-in for help
          with whatever comes up. The sessions take you from first idea to a
          coaching program ready to sell.
        </p>
      </section>

      <section className="mt-9">
        {BUILD_VIDEO ? (
          <VimeoEmbed video={BUILD_VIDEO} title="Introducing Build" />
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
          <p className="mt-5 text-sm leading-relaxed text-slate">
            Some people prefer to work this way. They don’t need someone looking
            over their shoulder. <Brand name="Build" /> is for them.
          </p>
        </div>

        <div className="psy-card flex flex-col gap-4 p-6">
          <div>
            <div className="psy-eyebrow text-blue">Monthly</div>
            <div className="mt-1 font-disp text-2xl font-semibold text-off">$149 a month</div>
          </div>
          <div>
            <div className="psy-eyebrow text-blue">Yearly</div>
            <div className="mt-1 font-disp text-2xl font-semibold text-off">$1,197 a year</div>
            <p className="mt-1 text-xs text-slate">Saves you $591, nearly four months free.</p>
          </div>
          <Link href="/join?plan=build" className="psy-btn mt-2 w-full justify-center">
            Join Build
          </Link>
          {/* Renewal and refund terms beside the button (terms 3.2, 4.1-4.4). */}
          <p className="text-xs leading-relaxed text-slate">
            Renews automatically until you cancel. Monthly: cancel any time, no
            refunds. Yearly: a full refund within 14 days of paying.
          </p>
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
