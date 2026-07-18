import type { Week } from "@/lib/types";

// The "bridge" device: the programme as a horizontal path. Reached weeks are
// filled; the current week is ringed and flagged; future weeks dim. Ends in a
// booking node so the path runs into the next action.
export function Stepper({
  weeks,
  currentWeek,
  onBookId,
}: {
  weeks: Week[];
  currentWeek: number;
  onBookId: string;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const shortTitle = (t: string) => (t.split("—")[0] || t).trim();

  return (
    <section className="psy-card mb-8 p-6">
      <div className="mb-5">
        <div className="psy-eyebrow text-blue">The Programme</div>
        <p className="mt-1.5 max-w-[52ch] text-[13px] text-slate">
          Each week builds on the last. Weeks unlock as you progress — your
          current focus is highlighted.
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
              title={shortTitle(w.title)}
              state={current ? "current" : unlocked ? "done" : "locked"}
              badge={unlocked ? (current ? "★" : "✓") : pad(w.number)}
              flag={current ? "You are here" : undefined}
            />
          );
        })}

        <a
          href={`#${onBookId}`}
          className="group relative min-w-[100px] flex-none pt-[26px] text-center"
        >
          <span className="absolute left-0 right-0 top-[13px] h-0.5 bg-[repeating-linear-gradient(90deg,rgba(30,144,255,.4)_0_5px,transparent_5px_10px)]" />
          <span className="absolute left-1/2 top-0 z-10 grid h-[26px] w-[26px] -translate-x-1/2 place-items-center rounded-full border-2 border-dashed border-blue/40 bg-ink font-disp text-[11px] font-semibold text-blue transition group-hover:scale-110 group-hover:border-solid">
            +
          </span>
          <span className="mt-1.5 block font-disp text-[11px] uppercase tracking-[1px] text-slate">
            Next
          </span>
          <span className="mt-0.5 block px-1.5 text-[12px] leading-tight text-blue">
            Book your session
          </span>
        </a>
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
      ? "bg-blue border-blue text-[#04122a]"
      : state === "current"
        ? "bg-ink border-blue text-blue shadow-[0_0_0_4px_rgba(30,144,255,.14)]"
        : "bg-panel border-line text-slate";
  const bar = state === "locked" ? "bg-line" : "bg-blue";
  const text = state === "locked" ? "text-slate" : "text-off";

  return (
    <div
      className={`relative min-w-[96px] flex-none pt-[26px] text-center ${state === "locked" ? "opacity-45" : ""}`}
    >
      <span className={`absolute left-0 right-0 top-[13px] h-0.5 ${bar}`} />
      <span
        className={`absolute left-1/2 top-0 z-10 grid h-[26px] w-[26px] -translate-x-1/2 place-items-center rounded-full border-2 font-disp text-[11px] font-semibold ${dot}`}
      >
        {badge}
      </span>
      <span className="mt-1.5 block font-disp text-[11px] uppercase tracking-[1px] text-slate">
        {label}
      </span>
      <span className={`mt-0.5 block px-1.5 text-[12px] leading-tight ${text}`}>
        {title}
      </span>
      {flag && (
        <span className="mt-1 block font-disp text-[9px] uppercase tracking-[1px] text-blue">
          {flag}
        </span>
      )}
    </div>
  );
}
