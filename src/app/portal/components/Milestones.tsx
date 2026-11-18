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
  return (
    <>
      <section className="psy-card mt-6 p-5 sm:p-6" aria-labelledby="momentum-title">
        <h2 id="momentum-title" className="font-disp text-[16px] font-semibold">Your momentum</h2>
        <p className="mt-0.5 text-[13px] text-mut">Every move you finish counts. Badges stay earned.</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            [momentum.movesDone, "moves done"],
            [momentum.weeksInMotion, momentum.weeksInMotion === 1 ? "week in motion" : "weeks in motion"],
            [momentum.names, "names on your list"],
          ].map(([n, label]) => (
            <div key={String(label)} className="rounded-[14px] border border-line bg-ink px-3.5 py-3">
              <b className="block font-disp text-[24px] font-bold leading-tight text-off sm:text-[26px]">{n}</b>
              <span className="text-[12px] leading-tight text-mut">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="psy-card mt-4 p-5 sm:p-6" aria-labelledby="milestones-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="milestones-title" className="font-disp text-[16px] font-semibold">Milestones</h2>
          <span className="text-[12.5px] text-mut">{earned} of {badges.length}</span>
        </div>
        <p className="mt-0.5 text-[13px] text-mut">Earned by doing the work, never by logging in.</p>
        <ul className="mt-4 grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-5">
          {badges.map((b) => (
            <li key={b.key} className="text-center">
              <Medal badge={b} />
              <b className={`mt-2 block font-disp text-[12.5px] font-semibold leading-tight ${b.earned ? "text-off" : "text-mut"}`}>
                {b.name}
              </b>
              <small className="mt-0.5 block text-[11px] leading-snug text-mut">{b.how}</small>
            </li>
          ))}
        </ul>
      </section>

      <MilestoneToast earned={badges.filter((b) => b.earned)} memberKey={memberKey} />
    </>
  );
}
