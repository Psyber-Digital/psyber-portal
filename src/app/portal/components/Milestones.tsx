import type { Badge, Momentum } from "@/lib/milestones";
import { MilestoneToast } from "./MilestoneToast";
import { BadgeGlyph } from "./MilestoneGlyph";

// Momentum and milestones under the move card (Don, board r01, 18 Nov 2026).
// Momentum only counts up. Badges are earned by doing the work.

export function Medal({ badge, size = 56 }: { badge: Badge; size?: number }) {
  const earned = badge.earned;
  const tone = badge.tone === "blue" ? "psy-medal-blue" : "psy-medal-orange";
  return (
    <span
      className={`relative mx-auto grid place-items-center rounded-full ${earned ? `${tone} psy-medal-shine` : "border-2 border-dashed border-[#34466e]"}`}
      style={{ width: size, height: size }}
    >
      <BadgeGlyph
        icon={badge.icon}
        className={`h-[45%] w-[45%] ${earned ? (badge.tone === "blue" ? "stroke-[#04122a]" : "stroke-[#2a1400]") : "stroke-[#4a5d86]"}`}
      />
    </span>
  );
}

export function Milestones({
  badges,
  momentum,
  memberKey,
}: {
  badges: Badge[];
  momentum: Momentum;
  /** Keeps the "new milestone" memory per member on a shared browser. */
  memberKey: string;
}) {
  const earned = badges.filter((b) => b.earned).length;
  // Only the next badge to earn says how; the rest show it on hover or tap.
  // Prefer the countable badge nearest to done, so the bar has a clear finish
  // line (goal gradient; card IM = A, 25 Nov 2026).
  const countable = badges
    .filter((b) => !b.earned && b.progress && b.progress.have > 0)
    .sort((a, b) => b.progress!.have / b.progress!.need - a.progress!.have / a.progress!.need);
  const next = countable[0] ?? badges.find((b) => !b.earned);
  return (
    <section className="psy-card mt-6 p-5 sm:p-6" aria-labelledby="progress-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="progress-title" className="font-disp text-[16px] font-semibold">Your progress</h2>
        <span className="text-[12.5px] text-mut">{earned} of {badges.length} milestones</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          [momentum.movesDone, momentum.movesDone === 1 ? "move done so far" : "moves done so far"],
          [momentum.weeksInMotion, momentum.weeksInMotion === 1 ? "active week" : "active weeks"],
          [momentum.names, "names on your list"],
        ].map(([n, label]) => (
          <div key={String(label)} className="rounded-[14px] border border-line bg-ink px-3.5 py-3">
            <b className="block font-disp text-[24px] font-bold leading-tight text-off">{n}</b>
            <span className="text-[12px] leading-tight text-mut">{label}</span>
          </div>
        ))}
      </div>
      {next && (
        <p className="mt-4 text-[13px] text-sec">
          Next milestone: <b className="font-semibold text-off">{next.name}</b>. {next.how}.
          {next.progress && (
            <>
              {" "}
              <b className="text-orange">
                {Math.max(next.progress.need - next.progress.have, 0)} more to unlock!
              </b>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-line">
                <i
                  className="block h-full rounded-full bg-[linear-gradient(90deg,#FF8D1E,#1E90FF)]"
                  style={{ width: `${Math.min(100, Math.round((next.progress.have / next.progress.need) * 100))}%` }}
                />
              </span>
            </>
          )}
        </p>
      )}
      <ul className="mt-4 grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-7">
        {badges.map((b) => (
          <li key={b.key} className="text-center" title={`${b.name}: ${b.how}`}>
            <Medal badge={b} size={48} />
            <span className={`mt-1.5 block font-disp text-[11.5px] font-semibold leading-tight ${b.earned ? "text-off" : "text-mut"}`}>
              {b.name}
            </span>
            {!b.earned && b.progress && b.progress.have > 0 && (
              <span className="mt-0.5 block text-[10.5px] text-sec">
                {Math.min(b.progress.have, b.progress.need)}/{b.progress.need}
              </span>
            )}
            <span className="sr-only">{b.earned ? "Earned." : `Not yet. ${b.how}.`}</span>
          </li>
        ))}
      </ul>
      <MilestoneToast earned={badges.filter((b) => b.earned)} memberKey={memberKey} />
    </section>
  );
}
