import type { ReactNode } from "react";
import type { Move, MoveOpens } from "@/lib/moves";
import type { DueMove } from "@/lib/dueMoves";
import { tickMove, untickMove, parkMove } from "../moveActions";
import { CelebrateButton } from "./CelebrateButton";

// "Your next move": the centre of the portal (Don, board r01, 18 Nov 2026:
// "make the cards more centre... aesthetically pleasing... fun"). Today's dated
// cards sit above; the session's video, sheet and resources sit in the toolkit
// below. War Room run psyber/2026-11-18-next-move.

export type MoveLinks = Partial<Record<Exclude<MoveOpens, "none">, string>>;

const OPEN_LABEL: Record<Exclude<MoveOpens, "none">, string> = {
  video: "Watch the video",
  sheet: "Open the Working Sheet",
  card: "Open the Principle Card",
  list: "Open The List",
  shared: "Open Shared Files",
};

// Video sits on this page; the rest open in a new tab, as they always have.
const SAME_TAB: MoveOpens[] = ["video", "list", "shared"];

function Label({ children }: { children: ReactNode }) {
  return (
    <div className="mx-0.5 mb-3 mt-7 flex items-center gap-3">
      <span className="psy-eyebrow whitespace-nowrap text-mut">{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function OpenLink({
  kind,
  href,
  small,
  where,
}: {
  kind: Exclude<MoveOpens, "none">;
  href?: string;
  small?: boolean;
  /** e.g. "block 1": shown on the button, so the card needs no extra line. */
  where?: string;
}) {
  if (!href) return null;
  const same = SAME_TAB.includes(kind);
  return (
    <a
      href={href}
      target={same ? undefined : "_blank"}
      rel={same ? undefined : "noopener noreferrer"}
      className={`psy-btn-ghost ${small ? "!px-3 !py-2 !text-[13px]" : "!rounded-xl !px-5 !py-3 !text-[14.5px]"}`}
    >
      {OPEN_LABEL[kind]}
      {where ? `, ${where}` : ""} →
    </a>
  );
}

export function NextMove({
  session,
  sessionName,
  totalSessions,
  media,
  parked = new Set(),
  moves,
  ticked,
  sessionFinished,
  finish,
  meet,
  links,
  due = [],
}: {
  session: number;
  /** e.g. "Niche". */
  sessionName: string;
  totalSessions: number;
  /** Shown inside the card for a video move: the session's video itself. */
  media?: ReactNode;
  /** Moves the member pressed "Not now" on. They come back after the rest. */
  parked?: Set<string>;
  moves: Move[];
  ticked: Set<string>;
  /** The session's own "complete" is already recorded (Build / Foundations). */
  sessionFinished: boolean;
  /** The existing finish form, shown inside the card when its move comes up. */
  finish?: ReactNode;
  /** "the drop-in", "our next call", or "" for Foundations. */
  meet: string;
  links: MoveLinks;
  /** Dated cards from the member's own list: follow-ups, calls, today's ten. */
  due?: DueMove[];
}) {
  if (moves.length === 0) return null;

  const isDone = (m: Move) => (m.finish ? sessionFinished : ticked.has(m.id));
  const doneCount = moves.filter(isDone).length;
  // "Not now" parks a move: the next unparked one comes first, and parked
  // ones come back once everything else is done (the War Room's park).
  const current = moves.find((m) => !isDone(m) && !parked.has(m.id)) ?? moves.find((m) => !isDone(m));
  const index = current ? moves.indexOf(current) : moves.length;
  const upNext = current ? moves.slice(index + 1).find((m) => !isDone(m)) : undefined;

  return (
    <>
      {/* Where you are: the session, and how far through it. */}
      <div className="mx-0.5 mt-5">
        <div className="flex items-baseline justify-between gap-3 text-[13px] text-mut">
          <span>
            Session {session} of {totalSessions} · <b className="font-semibold text-sec">{sessionName}</b>
          </span>
          <span>
            {current ? `Move ${index + 1} of ${moves.length}` : `${moves.length} of ${moves.length} done`}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <i
            className="block h-full rounded-full bg-[linear-gradient(90deg,#FF8D1E,#1E90FF)] transition-[width] duration-700"
            style={{ width: `${Math.round((doneCount / Math.max(moves.length, 1)) * 100)}%` }}
          />
        </div>
      </div>

      {due.length > 0 && (
        <>
          <Label>Due today</Label>
          <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2" aria-label="Due today">
            {due.map((d) => (
              <li
                key={d.key}
                className="flex w-[260px] flex-none snap-start flex-col rounded-[14px] border border-line border-t-[3px] border-t-blue bg-panel p-3.5"
              >
                <p className="font-disp text-[14.5px] font-semibold leading-snug text-off">{d.title}</p>
                <p className="mb-3 mt-1 flex-1 text-[12.5px] leading-relaxed text-sec">{d.why}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <OpenLink kind={d.opens} href={d.href ?? links[d.opens]} small />
                  {d.tickIds.length > 0 && (
                    <form action={tickMove}>
                      {d.tickIds.map((id) => (
                        <input key={id} type="hidden" name="move" value={id} />
                      ))}
                      <CelebrateButton className="psy-btn !px-3 !py-2 !text-[13px]" />
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="relative mt-5 pb-5">
        {/* The deck: two cards waiting behind this one. */}
        <div className="absolute inset-x-11 bottom-0 h-16 rounded-[22px] border border-line bg-panel2 opacity-40" aria-hidden="true" />
        <div className="absolute inset-x-5 bottom-2.5 h-16 rounded-[22px] border border-line bg-panel2 opacity-75" aria-hidden="true" />

        <section
          key={current?.id ?? "all-done"}
          aria-labelledby="next-move-title"
          className="psy-deck-card relative z-10 overflow-hidden rounded-[22px] border border-[#33497a] bg-[linear-gradient(160deg,#1a2744_0%,#121B2E_60%)] p-5 shadow-card sm:p-8"
        >
          <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#FF8D1E,#ffb36b_50%,#1E90FF)]" aria-hidden="true" />

          {current ? (
            <>
              <div className="font-disp text-[11px] font-semibold uppercase tracking-[1.6px] text-mut">
                Your next move{current.mins ? ` · ${current.mins}` : ""}
              </div>
              <h2 id="next-move-title" className="mt-2.5 font-disp text-[22px] font-semibold leading-snug text-off sm:text-[28px]">
                {current.title}
              </h2>
              <p className="mt-2.5 max-w-[58ch] text-[15px] leading-relaxed text-sec sm:text-[16px]">{current.why}</p>

              {current.finish ? (
                finish
              ) : (
                <>
                  {current.opens === "video" && media ? (
                    <div className="mt-5">{media}</div>
                  ) : current.opens !== "none" && current.opens !== "video" ? (
                    <div className="mt-5">
                      <OpenLink kind={current.opens} href={links[current.opens]} where={current.where} />
                    </div>
                  ) : null}
                  <form action={tickMove} className="mt-4">
                    <input type="hidden" name="move" value={current.id} />
                    <CelebrateButton className="psy-btn-orange w-full !rounded-xl !py-3.5 !text-[16px] sm:w-auto sm:!px-10" />
                  </form>
                  <form action={parkMove} className="mt-3 text-center sm:text-left">
                    <input type="hidden" name="move" value={current.id} />
                    <input type="hidden" name="session" value={session} />
                    <button type="submit" className="text-[13px] text-mut underline decoration-dotted underline-offset-2 hover:text-off">
                      Not now
                    </button>
                  </form>
                </>
              )}
            </>
          ) : (
            <>
              <h2 id="next-move-title" className="font-disp text-[22px] font-semibold leading-snug text-off sm:text-[28px]">
                Every move for Session {session} is done.
              </h2>
              <p className="mt-2.5 max-w-[56ch] text-[15px] leading-relaxed text-sec">
                {meet
                  ? `Well done. Bring what you made to ${meet}.`
                  : "Well done. Sessions 2 to 7, and the weekly drop-in, open in Build\u2122."}
              </p>
            </>
          )}
        </section>
      </div>

      <details className="group mx-1.5 mt-1">
        <summary className="cursor-pointer list-none text-[13px] text-mut marker:hidden">
          {upNext && (
            <>
              Up next: <b className="font-semibold text-sec">{upNext.title}</b>
              <span className="mx-1.5">·</span>
            </>
          )}
          <span className="underline decoration-dotted underline-offset-2">
            <span className="group-open:hidden">See all {moves.length}</span>
            <span className="hidden group-open:inline">Hide the list</span>
          </span>
        </summary>
        <ol className="mt-3 grid gap-1.5">
          {moves.map((m, i) => (
            <li key={m.id} className="flex items-start gap-3 text-[13.5px] leading-snug">
              <span
                className={`mt-px grid h-5 w-5 flex-none place-items-center rounded-full border text-[11px] ${
                  isDone(m) ? "border-blue bg-blue/15 text-blue" : m === current ? "border-orange text-orange" : "border-line text-mut"
                }`}
                aria-hidden="true"
              >
                {isDone(m) ? "✓" : i + 1}
              </span>
              <span className={`min-w-0 flex-1 ${isDone(m) ? "text-mut" : "text-sec"}`}>{m.title}</span>
              {!m.finish && (
                <form action={isDone(m) ? untickMove : tickMove}>
                  <input type="hidden" name="move" value={m.id} />
                  <button
                    type="submit"
                    className="text-[12px] text-mut underline decoration-dotted underline-offset-2 hover:text-off"
                  >
                    {isDone(m) ? "Undo" : "Mark done"}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ol>
      </details>
    </>
  );
}
