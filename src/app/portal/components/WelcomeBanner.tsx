import type { Week } from "@/lib/types";
import { pad, stripWeekPrefix } from "@/lib/week";

// The current week's hero banner: eyebrow, "Week NN — Title", a one-line intro,
// and a "You are here" chip. Warm orange glow bleeds in from the top-right.
export function WelcomeBanner({ week, intro }: { week: Week; intro?: string }) {
  return (
    <section className="psy-card relative mb-[26px] flex flex-wrap items-end justify-between gap-5 overflow-hidden p-7">
      <span className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,141,30,.16),transparent_68%)]" />
      <div className="relative">
        <div className="psy-eyebrow text-orange">This week · Therapy+</div>
        <h1 className="mt-2 font-disp text-[26px] font-bold leading-tight tracking-[-0.3px]">
          Week {pad(week.number)} — {stripWeekPrefix(week.title)}
        </h1>
        {(intro || week.description) && (
          <p className="mt-2 max-w-[56ch] text-[14.5px] text-sec">{intro || week.description}</p>
        )}
      </div>
      <span className="relative whitespace-nowrap rounded-full border border-orange/40 bg-orange/[0.14] px-3.5 py-1.5 font-disp text-[12px] font-semibold text-orange">
        ★ You are here
      </span>
    </section>
  );
}
