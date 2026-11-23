import Link from "next/link";
import { startCheckout } from "./actions";
import { Brand } from "../components/Brand";
import { Countdown } from "../components/Countdown";
import { PRICE, type Step } from "@/lib/ladder";
import { STRATEGY_CALL_URL } from "@/lib/upsellEmails";

// The Build upgrade page body for a Foundations member (Don, card P1, 21 Nov
// 2026). Split from page.tsx so it can be previewed with sample data.
export function BuildOffer({ step, back }: { step: Step | null; back: React.ReactNode }) {
  // Foundations: offer Build. startCheckout re-checks the saving on the server
  // (launch ladder, ADR-0027 addendum 6).
  // Redesigned to sell harder and look better (Don, card P1, 21 Nov 2026).
  // Claims checked against the terms: 4.1-4.4 (cancel, refund), 8.2 (list),
  // 2.2-2.3 (sessions, drop-in). The $2,500 figure is not from the terms: it is
  // the floor of the approved "$2.5K-$10K+ per client" messaging, shown as
  // arithmetic with "landing one is your work", never as a promise (terms 5.1).
  // Lane-guard and voice-guard ran on this redesign, 21 Nov 2026; fixes applied.
  const firstYear = step ? PRICE.yearly - step.off : PRICE.yearly;
  const perDay = (firstYear / 365).toFixed(2);
  // Plain arithmetic against the lowest coaching fee Psyber quotes ($2,500).
  // Hidden if $2,500 ever covers the year less than twice, so it can't go untrue.
  const times = Math.floor(2500 / firstYear);
  const timesWord = times >= 4 ? "four times over" : times === 3 ? "three times over" : times === 2 ? "twice over" : "";
  const yearWord = step ? "your first year" : "a year";
  // Yearly only (Don, 23 Nov 2026). Shown per month to make the price easy to weigh.
  const perMonth = Math.ceil(firstYear / 12);

  const tick = (
    <svg viewBox="0 0 20 20" aria-hidden className="mt-[3px] h-4 w-4 flex-none text-orange">
      <path fill="currentColor" d="M8.2 14.6 3.9 10.3l1.4-1.4 2.9 2.9 6.5-6.5 1.4 1.4z" />
    </svg>
  );
  const inside = [
    "A clear first step and a proven roadmap, so you know where to start",
    "Every session, each with its video, Working Sheet and Principle Card",
    "Each session opens as you finish the one before, so you only work on what matters next",
    "A live group drop-in every week, for help before a wrong turn costs you weeks",
    "Go as fast as your week allows",
  ];
  const oneOnOne = [
    "Seven one-on-one sessions and three clinics to build your program",
    "Personal feedback on your niche, message, offer and program",
  ];
  const blueTick = (
    <svg viewBox="0 0 20 20" aria-hidden className="mt-[3px] h-4 w-4 flex-none text-blue">
      <path fill="currentColor" d="M8.2 14.6 3.9 10.3l1.4-1.4 2.9 2.9 6.5-6.5 1.4 1.4z" />
    </svg>
  );
  const faqs: [string, string][] = [
    ["Want full support?", "Choose one-on-one. We build your program with you, step by step, with personal feedback. It starts with a call."],
    ["What if I have a busy month?", "Your sessions wait for you. Pick up where you left off, and bring anything you're stuck on to the weekly drop-in."],
    ["Can I cancel?", "Yes, any time, online, from Manage billing on your account page. You keep access until the end of the period you've paid for."],
    ["What happens to my contact list?", "It's yours. Export it any time. If you cancel Build, it stays with you on Build Free. If you close your account, it's deleted, so export it first."],
  ];

  return (
    <main className="relative z-10 mx-auto mt-[4vh] w-full max-w-[1000px] px-5 pb-16">
      {/* Phone order: headline, then the offer, then the detail. Desktop: the
          detail on the left, the offer on the right (Don, P1, 21 Nov 2026). */}
      <header className="max-w-[640px]">
        <div className="psy-eyebrow text-orange">Introducing <Brand name="Build" tm /></div>
        <h1 className="mt-2 font-disp text-[28px] font-semibold leading-[1.2] sm:text-[34px]">
          Launch your coaching program on your own, without the pitfalls
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-slate">
          Some people want to do it themselves, at their own pace. They don’t need constant
          support. But going it alone has its pitfalls: not knowing where to start, too much
          information, months spent on the wrong thing. We designed <Brand name="Build" /> so
          you can go it alone and avoid them.
        </p>
        <p className="mt-3 text-[14px] text-sec">
          Want full support instead?{" "}
          <a href="#one-on-one" className="font-semibold text-blue">See one-on-one →</a>
        </p>
      </header>
      <div className="mt-6 grid items-start gap-6 md:grid-cols-[1.15fr_1fr]">
        {/* Right: the offer, then one-on-one. Not sticky: the column is taller than a screen. */}
        <aside className="md:col-start-2 md:row-start-1">
          {step && (
            <Countdown
              endsAt={step.endsAt.toISOString()}
              off={step.off}
              nextOff={step.next?.off}
              yearly={PRICE.yearly}
              onSale
              link={false}
            />
          )}
          <div className="psy-card p-6">
            <form action={startCheckout}>
              <button
                name="plan"
                value="yearly"
                className="group relative block w-full rounded-[14px] border-2 border-orange bg-orange/[0.08] p-5 text-left transition hover:bg-orange/[0.14]"
              >
                <span className="block font-disp text-[13px] font-semibold uppercase tracking-[1.2px] text-sec">Yearly</span>
                <span className="mt-1 flex items-baseline gap-2">
                  <span className="font-disp text-[32px] font-semibold leading-none text-off">${firstYear}</span>
                  {step && <span className="text-[15px] text-slate line-through">${PRICE.yearly}</span>}
                  <span className="text-[13px] text-slate">{step ? "your first year" : "a year"}</span>
                </span>
                <span className="mt-2 block text-[13px] leading-relaxed text-sec">
                  Under ${perMonth} a month, paid once a year.
                  {step ? ` Then $${PRICE.yearly} a year.` : ""}
                </span>
                <span className="psy-btn mt-4 block w-full text-center">Join Build™</span>
              </button>

              {/* Separate renewal consent, apart from the terms (adviser Q2,
                  approved by Don in m06). Checked again on the server. */}
              <label className="mt-5 flex items-start gap-2.5 text-[13px] leading-relaxed text-slate">
                <input type="checkbox" name="accept_renewal" required className="mt-1" />
                <span>I agree my <Brand name="Build" /> membership renews automatically until I cancel.</span>
              </label>
            </form>

            {/* Risk reversal: terms 4.3 (14 days). */}
            <div className="mt-4 flex gap-2.5 rounded-[10px] bg-blue/[0.08] p-3 text-[13px] leading-relaxed text-sec">
              <svg viewBox="0 0 20 20" aria-hidden className="mt-[2px] h-4 w-4 flex-none text-blue">
                <path fill="currentColor" d="M10 1.5 3 4.2v5c0 4.3 3 7.9 7 9.3 4-1.4 7-5 7-9.3v-5zm-1.3 12-3.4-3.4 1.4-1.4 2 2 4.4-4.4 1.4 1.4z" />
              </svg>
              <span>
                <b className="text-off">14-day full refund.</b> Change your mind? Ask within 14 days of
                paying and get every cent back (terms apply).
              </span>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-slate">
              Renews automatically each year until you cancel:{" "}
              {step ? `$${firstYear} your first year, then $${PRICE.yearly} a year.` : `$${PRICE.yearly} a year.`} Cancel
              any time from Manage billing.
              Stripe takes the payment. We never see your card details.
            </p>
          </div>

          {/* One-on-one beside Build, before payment, and hard to miss (Don, P1
              notes 21 Nov 2026: "barely noticeable", "add a question like want
              full support?"). Bullets are the approved one-on-one wording
              (upsell email A, card m03). The guarantee is one-on-one only
              (terms 5.2), so it sits here and never in the Build column. */}
          <div id="one-on-one" className="mt-4 overflow-hidden rounded-[18px] border-2 border-blue bg-[linear-gradient(160deg,rgba(30,144,255,0.18),rgba(30,144,255,0.04))] p-6">
            <div className="psy-eyebrow text-blue">One-on-one support</div>
            <h2 className="mt-1 font-disp text-[22px] font-semibold leading-snug text-off">Want full support?</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-sec">
              Launch your coaching program with us beside you. We build it with you, step by step.
            </p>
            <ul className="mt-3 space-y-2">
              {oneOnOne.map((t) => (
                <li key={t} className="flex gap-2.5 text-[13.5px] leading-relaxed text-sec">
                  {blueTick}
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-3 rounded-[12px] border border-blue/50 bg-blue/[0.14] p-4">
              <svg viewBox="0 0 20 20" aria-hidden className="mt-[2px] h-6 w-6 flex-none text-blue">
                <path fill="currentColor" d="M10 1.5 3 4.2v5c0 4.3 3 7.9 7 9.3 4-1.4 7-5 7-9.3v-5zm-1.3 12-3.4-3.4 1.4-1.4 2 2 4.4-4.4 1.4 1.4z" />
              </svg>
              <div>
                <p className="font-disp text-[16px] font-semibold text-off">Our 90-Day Guarantee</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-sec">
                  We stay with you until your first paying coaching client signs, as long as you do the
                  work and keep at it.
                </p>
              </div>
            </div>
            <a href={STRATEGY_CALL_URL} className="psy-btn mt-5 block w-full text-center">
              Book a call about one-on-one
            </a>
            <Link href="/portal/one-on-one" className="mt-3 block text-center text-[13px] font-semibold text-blue">
              See what one-on-one includes →
            </Link>
          </div>
        </aside>

        {/* Left: why Build. Sold, not described (Codex VOICE-20261030-1, -2 and
            20261031-1): for people who go it alone and want to avoid the
            pitfalls; never defined by what one-on-one adds (r11). */}
        <section className="md:col-start-1 md:row-start-1">

          <div className="psy-card p-6">
            <h2 className="font-disp text-[17px] font-semibold">What’s inside</h2>
            <ul className="mt-3 space-y-2.5">
              {inside.map((t) => (
                <li key={t} className="flex gap-2.5 text-[14.5px] leading-relaxed text-sec">
                  {tick}
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="psy-card p-5">
              <p className="font-disp text-[26px] font-semibold text-off">${perDay}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-slate">
                a day {step ? "for your first year " : ""}on the yearly plan.
              </p>
            </div>
            {timesWord && (
              <div className="psy-card p-5">
                <p className="font-disp text-[26px] font-semibold text-off">1 client</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-slate">
                  at $2,500 covers {yearWord} {timesWord}. Landing one is your work: <Brand name="Build" /> shows you the steps.
                </p>
              </div>
            )}
          </div>

          <p className="mt-6 border-l-2 border-orange pl-4 font-disp text-[16px] font-semibold leading-snug text-off">
            Every week you wait is another week your program isn’t for sale.
          </p>

          <div className="mt-8">
            <h2 className="font-disp text-[17px] font-semibold">Questions</h2>
            <dl className="mt-3 space-y-4">
              {faqs.map(([q, a]) => (
                <div key={q}>
                  <dt className="text-[14.5px] font-semibold text-off">{q}</dt>
                  <dd className="mt-1 text-[14px] leading-relaxed text-slate">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

      </div>
      {back}
    </main>
  );
}
