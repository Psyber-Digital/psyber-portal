import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/app/portal/components/Brand";

// One question before the strategy call (Don, r38 A, 30 Oct): the same choice
// as the quiz's last question. End-to-end support goes to the strategy call;
// a roadmap, resources and drop-ins goes to the Build page. Free, and ours,
// instead of a paid Calendly routing form. At launch, with Don's yes,
// psyberdigital.com/call points here.
const STRATEGY_CALL_URL = "https://calendly.com/psyberdigital/coaching-application";

export const metadata = {
  title: "Book a call · Psyber Digital",
  description: "One quick question, so we point you to the right next step.",
};

export default function CallPage() {
  return (
    <main className="relative z-10 mx-auto w-full max-w-[640px] px-5 pb-20 pt-10">
      <div className="mb-10 flex justify-center">
        <Image src="/wordmark.png" alt="Psyber Digital" width={240} height={46} priority className="h-10 w-auto" />
      </div>

      <div className="psy-card p-7 sm:p-9">
        <div className="psy-eyebrow text-sec">One quick question</div>
        <h1 className="mt-2 font-disp text-2xl font-semibold leading-snug text-off">
          How would you like to build your coaching program?
        </h1>

        <div className="mt-6 grid gap-3">
          <a
            href={STRATEGY_CALL_URL}
            className="rounded-[12px] border border-line bg-white/[0.02] p-5 transition hover:border-blue/60"
          >
            <div className="font-disp text-[16px] font-semibold text-off">
              With support from start to finish
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate">
              End-to-end, over-the-shoulder support. Book a strategy call with us.
            </p>
            <span className="mt-3 inline-block text-sm font-semibold text-blue">Book a call →</span>
          </a>

          <Link
            href="/build"
            className="rounded-[12px] border border-line bg-white/[0.02] p-5 transition hover:border-[#F08328]/60"
          >
            <div className="font-disp text-[16px] font-semibold text-off">
              At my own pace
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate">
              A roadmap, resources and drop-ins when I need them. See{" "}
              <Brand name="Build" tm />.
            </p>
            <span className="mt-3 inline-block text-sm font-semibold text-sec">See how it works →</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
