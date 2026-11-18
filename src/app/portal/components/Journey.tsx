import Link from "next/link";
import type { WeekOutline } from "@/lib/types";
import { stripWeekPrefix } from "@/lib/week";

// The whole program as one line of seven stops, under three phases (Don,
// board r01, 18 Nov 2026). Replaces the Program stepper on the home page and
// keeps its job: every unlocked session is a link (?week=N) to its materials.
// Phase names come from the sessions themselves: Session 4 opens "from who you
// serve to how you serve them", and Session 7 is "Phase three: Launch".

export const shortTitle = (title: string) =>
  stripWeekPrefix(title).replace(/^session\s*\d+\s*[—–-]\s*/i, "").trim();

export function Journey({
  weeks,
  currentWeek,
  selected,
  finishedThrough,
  lockedNote,
}: {
  weeks: WeekOutline[];
  currentWeek: number;
  selected?: number;
  /** Highest session finished, so a finished current session shows its tick. */
  finishedThrough: number;
  /** e.g. "Sessions 2 to 7 open in Build™" for free members. */
  lockedNote?: string;
}) {
  const list = weeks.slice().sort((a, b) => a.number - b.number);
  return (
    <section className="psy-card mt-6 p-4 sm:p-5" aria-label="Your journey">
      <ol className="flex items-start">
        {list.map((w, i) => {
          const unlocked = w.number <= currentWeek;
          const done = w.number <= finishedThrough || w.number < currentWeek;
          const now = w.number === currentWeek && !done;
          const isSelected = selected === w.number && selected !== currentWeek;
          const dot = (
            <span
              className={`relative z-10 grid h-7 w-7 place-items-center rounded-full border-2 font-disp text-[12px] font-semibold ${
                done
                  ? "border-blue bg-blue text-[#04122a]"
                  : now
                    ? "border-orange bg-ink text-orange shadow-[0_0_0_5px_rgba(255,141,30,.15)]"
                    : "border-line bg-ink text-mut"
              } ${isSelected ? "ring-2 ring-off/60 ring-offset-2 ring-offset-ink" : ""}`}
            >
              {done ? "✓" : w.number}
            </span>
          );
          return (
            <li key={w.id} className="relative flex flex-1 flex-col items-center">
              {i < list.length - 1 && (
                <span
                  className={`absolute left-1/2 top-[13px] h-[3px] w-full rounded ${done ? "bg-blue" : "bg-line"}`}
                  aria-hidden="true"
                />
              )}
              {unlocked ? (
                <Link href={w.number === currentWeek ? "/portal" : `/portal?week=${w.number}`} aria-label={`Open Session ${w.number}`}>
                  {dot}
                </Link>
              ) : (
                dot
              )}
              <small
                className={`mt-1.5 hidden text-center font-disp text-[10.5px] font-medium leading-tight sm:block ${
                  now ? "text-orange" : "text-mut"
                }`}
              >
                {shortTitle(w.title)}
              </small>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex border-t border-line pt-2 text-center font-disp text-[10px] font-semibold uppercase tracking-[1.6px] text-mut">
        <div className="flex-[3]">Who you serve</div>
        <div className="flex-[3] border-l border-line">How you serve them</div>
        <div className="flex-1 border-l border-line">Launch</div>
      </div>
      {lockedNote && <p className="mt-2 text-center text-[12px] text-mut">{lockedNote}</p>}
    </section>
  );
}
