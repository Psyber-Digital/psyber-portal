import Link from "next/link";
import type { WeekOutline } from "@/lib/types";
import { pad, stripWeekPrefix } from "@/lib/week";

// The program as a horizontal path. Reached weeks are filled; the current week is
// ringed and flagged; remaining sessions dim to grey. Every UNLOCKED week is a link
// (?week=N) that opens that week's materials below — the stepper is the navigation.
// The week currently being viewed is highlighted.
export function Stepper({
  weeks,
  currentWeek,
  selected,
}: {
  weeks: WeekOutline[];
  currentWeek: number;
  selected?: number;
}) {
  return (
    <section className="psy-card mb-[22px] p-4 sm:mb-[26px] sm:p-6">
      <div className="mb-4 sm:mb-5">
        <div className="psy-eyebrow text-orange">The Program</div>
        <p className="mt-1.5 max-w-[54ch] text-[12.5px] leading-relaxed text-sec sm:text-[13px]">
          Each week builds on the last. Weeks unlock as you progress — tap any unlocked week to open it.
        </p>
      </div>

      <div className="-mx-1 flex items-start overflow-x-auto px-1 pb-1.5 [-webkit-overflow-scrolling:touch]">
        {weeks.map((w) => {
          const unlocked = w.number <= currentWeek;
          const isCurrent = w.number === currentWeek;
          const isSelected = selected != null && w.number === selected;
          return (
            <Node
              key={w.id}
              href={unlocked ? `/portal?week=${w.number}` : undefined}
              label={`Week ${pad(w.number)}`}
              title={stripWeekPrefix(w.title)}
              state={isCurrent ? "current" : unlocked ? "done" : "locked"}
              badge={unlocked ? (isCurrent ? "★" : "✓") : pad(w.number)}
              selected={isSelected}
              flag={isCurrent ? "You are here" : isSelected ? "Viewing" : undefined}
            />
          );
        })}
      </div>
    </section>
  );
}

function Node({
  href,
  label,
  title,
  state,
  badge,
  selected,
  flag,
}: {
  href?: string;
  label: string;
  title: string;
  state: "done" | "current" | "locked";
  badge: string;
  selected?: boolean;
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

  const inner = (
    <>
      <span className={`absolute left-0 right-0 top-[13px] h-[3px] rounded ${bar}`} />
      <span
        className={`absolute left-1/2 top-0 z-10 grid h-[28px] w-[28px] -translate-x-1/2 place-items-center rounded-full border-2 font-disp text-[11px] font-bold ${dot}`}
      >
        {badge}
      </span>
      <span className="mt-2 block font-disp text-[10.5px] uppercase tracking-[1px] text-sec sm:text-[11px]">
        {label}
      </span>
      <span className={`mt-0.5 block px-1.5 text-[12px] leading-tight sm:text-[12.5px] ${text}`}>
        {title}
      </span>
      {flag && (
        <span className="mt-1 block font-disp text-[9px] font-semibold uppercase tracking-[1px] text-orange">
          {flag}
        </span>
      )}
    </>
  );

  const cls = `relative block min-w-[88px] flex-none rounded-lg pt-[26px] pb-1 text-center sm:min-w-[104px] ${
    state === "locked" ? "opacity-50" : ""
  } ${selected ? "bg-orange/[0.07] ring-1 ring-inset ring-orange/40" : ""}`;

  return href ? (
    <Link
      href={href}
      scroll={false}
      className={`${cls} transition hover:bg-orange/[0.09] active:bg-orange/[0.14]`}
    >
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
