import type { ReactNode } from "react";
import type { Move, MoveOpens } from "@/lib/moves";
import { tickMove, untickMove } from "../moveActions";

// "Your next move": one card at the top of the session, the War Room's shape
// for a member. It says what to do now, why it matters, and opens the thing
// it uses. The session's video, sheet and resources stay below, unchanged.
// War Room run psyber/2026-11-18-next-move.

export type MoveLinks = Partial<Record<Exclude<MoveOpens, "none">, string>>;

const OPEN_LABEL: Record<Exclude<MoveOpens, "none">, string> = {
  video: "Watch the video",
  sheet: "Open the Working Sheet",
  card: "Open the Principle Card",
  list: "Open The List",
  shared: "Open Shared Files",
};

// Video sits on this page; the rest open in a new tab, as they do below.
const SAME_TAB: MoveOpens[] = ["video", "list", "shared"];

export function NextMove({
  session,
  moves,
  ticked,
  sessionFinished,
  finish,
  meet,
  links,
}: {
  session: number;
  moves: Move[];
  ticked: Set<string>;
  /** The session's own "complete" is already recorded (Build / Foundations). */
  sessionFinished: boolean;
  /** The existing finish form, shown inside the card when its move comes up. */
  finish?: ReactNode;
  /** "the drop-in" or "our next call". */
  meet: string;
  links: MoveLinks;
}) {
  if (moves.length === 0) return null;

  const isDone = (m: Move) => (m.finish ? sessionFinished : ticked.has(m.id));
  const doneCount = moves.filter(isDone).length;
  const current = moves.find((m) => !isDone(m));
  const index = current ? moves.indexOf(current) + 1 : moves.length;

  return (
    <section
      aria-labelledby="next-move-title"
      className="psy-card mb-[18px] mt-6 border-l-[3px] border-l-orange p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span className="psy-eyebrow text-orange">
          Your next move · Session {session}
          {current && (
            <span className="text-mut">
              {" "}
              · {index} of {moves.length}
            </span>
          )}
        </span>
        <Dots moves={moves} isDone={isDone} current={current} />
      </div>

      {current ? (
        <>
          <h2 id="next-move-title" className="mt-2.5 font-disp text-[21px] font-semibold leading-snug text-off">
            {current.title}
          </h2>
          <p className="mt-2 max-w-[64ch] text-[14.5px] leading-relaxed text-sec">{current.why}</p>
          {(current.mins || current.where) && (
            <p className="mt-2 text-[12.5px] text-mut">
              {[current.mins && `⏱ ${current.mins}`, current.where && `Working Sheet, ${current.where}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          {current.finish ? (
            finish
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <OpenButton move={current} links={links} />
              <form action={tickMove}>
                <input type="hidden" name="move" value={current.id} />
                <button type="submit" className="psy-btn">
                  Done ✓
                </button>
              </form>
            </div>
          )}
        </>
      ) : (
        <>
          <h2 id="next-move-title" className="mt-2.5 font-disp text-[21px] font-semibold leading-snug text-off">
            Every move for Session {session} is done.
          </h2>
          <p className="mt-2 max-w-[64ch] text-[14.5px] leading-relaxed text-sec">
            Well done. Bring what you made to {meet}.
          </p>
        </>
      )}

      <details className="group mt-5 border-t border-dashed border-line pt-3">
        <summary className="cursor-pointer list-none text-[12.5px] text-mut marker:hidden">
          <span className="underline decoration-dotted underline-offset-2">
            <span className="group-open:hidden">All {moves.length} moves this session</span>
            <span className="hidden group-open:inline">Hide the list</span>
          </span>
          <span className="ml-2">
            · {doneCount} done
          </span>
        </summary>
        <ol className="mt-3 grid gap-1.5">
          {moves.map((m, i) => (
            <li key={m.id} className="flex items-start gap-3 text-[13.5px] leading-snug">
              <span
                className={`mt-px grid h-5 w-5 flex-none place-items-center rounded-full border text-[11px] ${
                  isDone(m) ? "border-blue bg-blue/15 text-blue" : "border-line text-mut"
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
    </section>
  );
}

function OpenButton({ move, links }: { move: Move; links: MoveLinks }) {
  if (move.opens === "none") return null;
  const href = links[move.opens];
  if (!href) return null;
  const sameTab = SAME_TAB.includes(move.opens);
  return (
    <a
      href={href}
      target={sameTab ? undefined : "_blank"}
      rel={sameTab ? undefined : "noopener noreferrer"}
      className="psy-btn-ghost"
    >
      {OPEN_LABEL[move.opens]} →
    </a>
  );
}

function Dots({
  moves,
  isDone,
  current,
}: {
  moves: Move[];
  isDone: (m: Move) => boolean;
  current?: Move;
}) {
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      {moves.map((m) => (
        <span
          key={m.id}
          className={`h-2 w-2 rounded-full ${
            isDone(m) ? "bg-blue" : m === current ? "bg-orange" : "border border-line"
          }`}
        />
      ))}
    </span>
  );
}
