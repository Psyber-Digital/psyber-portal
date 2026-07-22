import type { WeekOutline } from "@/lib/types";
import { pad, stripWeekPrefix } from "@/lib/week";

// The programme as a horizontal path. Reached weeks are filled; the current week
// is ringed and flagged; remaining sessions (not yet reached or not yet published)
// dim to grey. The full outline is passed in so the whole programme is always
// visible. (Booking now lives at the foot of the page, so the path ends at the
// last week rather than a booking node.)
export function Stepper({ weeks, currentWeek }: { weeks: WeekOutline[]; currentWeek: number }) {
  return (
    <section className="psy-card mb-[26px] p-6">
      <div className="mb-5">
        <div className="psy-eyebrow text-orange">The Programme</div>
        <p className="mt-1.5 max-w-[54ch] text-[13px] text-sec">
          Each week builds on the last. Weeks unlock as you progress — your current focus is
          highlighted.
        </p>
      </div>

      <div className="flex items-start overflow-x-auto pb-1.5">
        {weeks.map((w) => {
          const unlocked = w.number <= currentWeek;
          const current = unlocked && w.number === currentWeek;
          return (
            <Node
              key={w.id}
              label={`Week ${pad(w.number)}`}
              title={stripWeekPrefix(w.title)}
              state={current ? "current" : unlocked ? "done" : "locked"}
              badge={unlocked ? (current ? "★" : "✓") : pad(w.number)}
              flag={current ? "You are here" : undefined}
            />
          );
        })}
      </div>
    </section>
  );
}

function Node({
  label,
  title,
  state,
  badge,
  flag,
}: {
  label: string;
  title: string;
  state: "done" | "current" | "locked";
  badge: string;
  flag?: string;
}) {
  const dot =
    state === "done"
      ? "bg-orange border-orange text-[#241100]"
      : state === "current"
        ? "bg-ink border-orange text-orange shadow-[0_0_0_5px_rgba(255,141,30,.16)]"
        : "bg-panel border-line text-mut";
  const bar = state === "locked" ? "bg-line" : "bg-orange";
  const text = state === "locked" ? "text-sec" : "text-off";

  return (
    <div
      className={`relative min-w-[104px] flex-none pt-[26px] text-center ${state === "locked" ? "opacity-50" : ""}`}
    >
      <span className={`absolute left-0 right-0 top-[13px] h-[3px] rounded ${bar}`} />
      <span
        className={`absolute left-1/2 top-0 z-10 grid h-[28px] w-[28px] -translate-x-1/2 place-items-center rounded-full border-2 font-disp text-[11px] font-bold ${dot}`}
      >
        {badge}
      </span>
      <span className="mt-2 block font-disp text-[11px] uppercase tracking-[1px] text-sec">
        {label}
      </span>
      <span className={`mt-0.5 block px-1.5 text-[12.5px] leading-tight ${text}`}>{title}</span>
      {flag && (
        <span className="mt-1 block font-disp text-[9px] font-semibold uppercase tracking-[1px] text-orange">
          {flag}
        </span>
      )}
    </div>
  );
}
