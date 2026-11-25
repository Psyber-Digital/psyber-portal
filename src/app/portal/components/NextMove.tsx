import type { ReactNode } from "react";
import type { Move, MoveOpens } from "@/lib/moves";
import type { DueMove } from "@/lib/dueMoves";
import { tickMove, untickMove, parkMove } from "../moveActions";
import { CelebrateButton } from "./CelebrateButton";
import type { Chapter } from "@/lib/story";
import { movePoints } from "@/lib/points";
import type { Gate } from "@/lib/gates";
import { FocusSound } from "./FocusSound";

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
  onOrange,
}: {
  onOrange?: boolean;
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
      // A sheet opens on the part this move is about, highlighted (Don, card BT1, 24 Nov 2026).
      href={kind === "sheet" && where ? `${href}#part=${encodeURIComponent(where)}` : href}
      target={same ? undefined : "_blank"}
      rel={same ? undefined : "noopener noreferrer"}
      className={
        onOrange
          ? "inline-block rounded-xl border border-[#1a0d00]/30 bg-white/30 px-5 py-3 font-disp text-[14.5px] font-semibold text-[#1a0d00] hover:bg-white/45"
          : `psy-btn-ghost ${small ? "!px-3 !py-2 !text-[13px]" : "!rounded-xl !px-5 !py-3 !text-[14.5px]"}`
      }
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
  chapter,
  points = 0,
  justDone,
  welcomeBack = false,
  list,
  gate,
  namesMin = 0,
  viewId,
  tickedToday = new Set(),
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
  /** The session as a chapter of the member's story (board m18, 19 Nov 2026). */
  chapter?: Chapter;
  /** Points kept so far. They only go up. */
  points?: number;
  /** The move just ticked, for the encouragement line. */
  justDone?: { title: string; points: number } | null;
  /** Back after a week or more away. */
  welcomeBack?: boolean;
  /** The contact-list strip: names now, the target, and names added this week. */
  list?: { names: number; target: number; thisWeek: number; earning: boolean };
  /** Every move done and the list at its minimum, before the session can finish (m19). */
  gate?: Gate;
  /** Moves ticked today (Eastern), for the "best done tomorrow" line. */
  tickedToday?: Set<string>;
  /** Names needed to finish this session, shown on the list strip from the start. */
  namesMin?: number;
  /** A card the member stepped back to (?move=id). */
  viewId?: string;
}) {
  if (moves.length === 0) return null;

  const isDone = (m: Move) => (m.finish ? sessionFinished : ticked.has(m.id));
  const doneCount = moves.filter(isDone).length;
  // "Not now" parks a move: the next unparked one comes first, and parked
  // ones come back once everything else is done (the War Room's park).
  // The finish comes last: every other move first, parked ones included (m19).
  const current =
    moves.find((m) => !isDone(m) && !m.finish && !parked.has(m.id)) ??
    moves.find((m) => !isDone(m) && !m.finish) ??
    moves.find((m) => !isDone(m));
  const index = current ? moves.indexOf(current) : moves.length;
  const upNext = current ? moves.slice(index + 1).find((m) => !isDone(m)) : undefined;
  // Going back (m19): any earlier card can be opened again, and stepped through.
  const viewed = viewId ? moves.find((m) => m.id === viewId) : undefined;
  const shown = viewed && viewed !== current ? viewed : current;
  const shownIndex = shown ? moves.indexOf(shown) : moves.length;
  const looking = Boolean(shown && shown !== current);
  const prev = shownIndex > 0 ? moves[Math.min(shownIndex, moves.length) - 1] : undefined;
  const fwd = looking && shownIndex + 1 < moves.length && moves[shownIndex + 1] !== current ? moves[shownIndex + 1] : undefined;
  const gateOk = !gate || gate.ok;

  return (
    <>
      {welcomeBack && (
        <p className="mx-0.5 mt-5 text-[14px] text-sec">
          Welcome back. You&rsquo;re on Chapter {session}{chapter ? `, ${chapter.title}` : ""}. Here&rsquo;s your next move.
        </p>
      )}

    {/* Level and points at the top (Don, card BT1, 24 Nov 2026). Level = chapter; the bar is how far through it. */}
      <div className="mx-0.5 mt-5 flex items-center gap-3 rounded-[14px] border border-line bg-panel px-3.5 py-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[radial-gradient(circle_at_35%_30%,#ffd29e,#FF8D1E_55%,#c45f00)] font-disp text-[18px] font-bold text-[#241100]">
          {session}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2 text-[13px]">
            <b className="font-disp font-semibold text-off">Level {session}</b>
            <span className="text-mut">
              {points} {points === 1 ? "point" : "points"} · {current ? `Move ${index + 1} of ${moves.length}` : `${moves.length} of ${moves.length} done`}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <i
              className="block h-full rounded-full bg-[linear-gradient(90deg,#FF8D1E,#1E90FF)] transition-[width] duration-700"
              style={{ width: `${Math.round((doneCount / Math.max(moves.length, 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* The chapter: where the hero is, and the villain in the way. */}
      <div className="mx-0.5 mt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-disp text-[11px] font-semibold uppercase tracking-[1.4px] text-mut">
            Your story · You are the hero
          </span>
          <FocusSound />
        </div>
        <div className="mt-1 font-disp text-[11.5px] font-semibold uppercase tracking-[1.6px] text-orange">
          Chapter {session} of {totalSessions} · Session {session}: {chapter?.recorded ?? sessionName}
        </div>
        {chapter && (
          <>
            <h2 className="mt-0.5 font-disp text-[22px] font-semibold leading-tight text-off sm:text-[24px]">{chapter.title}</h2>
            <p className="mt-1 text-[14px] leading-relaxed text-sec">{chapter.recap}</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-mut">
              The question: <span className="text-sec">{chapter.question}</span>
            </p>
          </>
        )}
      </div>

      {justDone && (
        <p className="mx-0.5 mt-5 rounded-xl border border-[#2f6b45] bg-[#13281c] px-4 py-3 text-[14px] text-[#c8f3d5]" role="status">
          <b className="font-semibold text-[#9be7b0]">Done{justDone.points > 0 ? `. +${justDone.points} points` : ""}.</b>{" "}
          {current ? <>Here&rsquo;s your next move.</> : null}
        </p>
      )}

      <div id="card" className="relative mt-4 scroll-mt-4 pb-5">
        {/* The deck: two cards waiting behind this one. */}
        <div className="absolute inset-x-11 bottom-0 h-16 rounded-[22px] border border-line bg-panel2 opacity-40" aria-hidden="true" />
        <div className="absolute inset-x-5 bottom-2.5 h-16 rounded-[22px] border border-line bg-panel2 opacity-75" aria-hidden="true" />

        <section
          key={shown?.id ?? "all-done"}
          aria-labelledby="next-move-title"
          className="psy-deck-card relative z-10 overflow-hidden rounded-[22px] border border-[#ffb36b] bg-[linear-gradient(160deg,#FFA54A_0%,#FF8D1E_45%,#E8780F_100%)] p-5 text-[#1a0d00] shadow-card sm:p-8"
        >
          {shown ? (
            <>
              <div className="flex items-baseline justify-between gap-3 font-disp text-[11px] font-semibold uppercase tracking-[1.6px] text-[#4a2600]">
                <span>
                  {looking ? "Looking back · " : ""}Move {shownIndex + 1} of {moves.length}
                  {shown.mins ? ` · ${shown.mins}` : ""}
                </span>
                {movePoints(shown) > 0 && <em className="not-italic">+{movePoints(shown)} points</em>}
              </div>
              <h2 id="next-move-title" className="mt-2.5 font-disp text-[22px] font-semibold leading-snug sm:text-[28px]">
                {shown.q}
              </h2>
              <p className="mt-2.5 max-w-[58ch] text-[15px] leading-relaxed sm:text-[16px]">
                <b className="font-semibold">{shown.title}</b>
              </p>
              <p className="mt-1.5 max-w-[58ch] text-[14.5px] leading-relaxed text-[#2e1700]">{shown.why}</p>

              {shown.finish ? (
                isDone(shown) ? (
                  <div className="mt-4">
                    <span className="inline-block rounded-xl bg-[#0B1220] px-5 py-3 font-disp text-[15px] font-semibold text-[#9be7b0]">
                      Session {session} finished ✓
                    </span>
                  </div>
                ) : gateOk ? (
                  <div className="mt-5 rounded-xl bg-[#0B1220] p-4 text-off">{finish}</div>
                ) : (
                  <div className="mt-5 rounded-xl bg-[#0B1220] p-4 text-[14px] leading-relaxed text-sec">
                    <b className="block font-disp text-[14.5px] font-semibold text-off">
                      {gate!.movesLeft.length === 0 && gate!.namesNeeded > 0 ? (
                        // Names are all that's left: say so big (Don, BT1 and S2, 25 Nov 2026).
                        <span className="block text-[19px] leading-snug text-orange">
                          Add {gate!.namesNeeded} more {gate!.namesNeeded === 1 ? "name" : "names"} to your list
                          {meet ? ` and Session ${session + 1} opens!` : ` to finish Session ${session}!`}
                        </span>
                      ) : (
                        <>Before you finish Session {session}</>
                      )}
                    </b>
                    <ul className="mt-2 grid gap-1.5">
                      {gate!.movesLeft.length > 0 && (
                        <li>
                          Finish {gate!.movesLeft.length === 1 ? "this move" : `these ${gate!.movesLeft.length} moves`} first:
                          <ul className="mt-1 grid list-disc gap-1 pl-5">
                            {gate!.movesLeft.map((m) => (
                              <li key={m.id}>
                                <a href={`/portal?move=${m.id}#card`} className="hover:underline">{m.title}</a>
                              </li>
                            ))}
                          </ul>
                        </li>
                      )}
                      {gate!.namesNeeded > 0 && (
                        <li>
                          Add {gate!.namesNeeded} more {gate!.namesNeeded === 1 ? "name" : "names"} to your list. You need{" "}
                          {gate!.namesMin} in total to finish this session. Not your current therapy clients. Former
                          therapy clients can go on, only to ask who they know.{" "}
                          <a href={links.list} className="text-blue underline">Open The List →</a>
                        </li>
                      )}
                    </ul>
                  </div>
                )
              ) : (
                <>
                  {shown.opens === "video" && media ? (
                    <div className="mt-5">{media}</div>
                  ) : shown.opens !== "none" && shown.opens !== "video" ? (
                    <div className="mt-5">
                      <OpenLink kind={shown.opens} href={links[shown.opens]} where={shown.where} onOrange />
                    </div>
                  ) : null}
                  {isDone(shown) ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className="font-disp text-[15px] font-semibold text-[#14361f]">✓ You did this one</span>
                      <form action={untickMove}>
                        <input type="hidden" name="move" value={shown.id} />
                        <button type="submit" className="text-[13px] underline decoration-dotted underline-offset-2">
                          Undo
                        </button>
                      </form>
                    </div>
                  ) : (
                    <>
                      {shown.afterDay && tickedToday.has(shown.afterDay) && (
                        <p className="mt-4 rounded-xl bg-[#0B1220]/85 px-4 py-3 text-[14px] text-off">
                          Best picked up tomorrow, with fresh eyes. You can close the page now. This card will be here.
                        </p>
                      )}
                      <form action={tickMove} className="mt-4">
                        <input type="hidden" name="move" value={shown.id} />
                        <CelebrateButton className="w-full rounded-xl bg-[#0B1220] py-3.5 font-disp text-[16px] font-semibold text-white hover:bg-[#16213a] sm:w-auto sm:px-10" />
                      </form>
                      {!looking && (
                        <form action={parkMove} className="mt-3 text-center sm:text-left">
                          <input type="hidden" name="move" value={shown.id} />
                          <input type="hidden" name="session" value={session} />
                          <button type="submit" className="text-[13px] underline decoration-dotted underline-offset-2">
                            Not now
                          </button>
                        </form>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Step back through earlier cards (m19). */}
              <nav className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#1a0d00]/20 pt-4 text-[13px] font-semibold" aria-label="Cards">
                {prev ? (
                  <a href={`/portal?move=${prev.id}#card`} className="hover:underline">← Previous card</a>
                ) : (
                  <span />
                )}
                {looking && (
                  <span className="flex gap-4">
                    {fwd && <a href={`/portal?move=${fwd.id}#card`} className="hover:underline">Later card →</a>}
                    <a href="/portal#card" className="rounded-lg bg-[#0B1220] px-3 py-1.5 text-white hover:bg-[#16213a]">Back to today&rsquo;s move</a>
                  </span>
                )}
              </nav>
            </>
          ) : (
            <>
              <h2 id="next-move-title" className="font-disp text-[22px] font-semibold leading-snug sm:text-[28px]">
                Every move for Session {session} is done.
              </h2>
              <p className="mt-2.5 max-w-[56ch] text-[15px] leading-relaxed text-[#2e1700]">
                {meet
                  ? `Well done. Bring what you made to ${meet}.`
                  : "Well done. Sessions 2 to 7, and the weekly drop-in, open in Build\u2122."}
              </p>
              {prev && (
                <a href={`/portal?move=${prev.id}#card`} className="mt-4 inline-block text-[13px] font-semibold hover:underline">← Previous card</a>
              )}
            </>
          )}
        </section>
      </div>

      {shown?.guide && (
        <div className="mx-0.5 mb-4 rounded-[14px] border border-line bg-panel px-4 py-3 text-[13.5px] leading-relaxed text-sec">
          <b className="mb-0.5 block font-disp text-[11px] font-semibold uppercase tracking-[1.4px] text-mut">Your guide · Asher</b>
          {shown.guide}
        </div>
      )}

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
                      <CelebrateButton label={d.doneLabel ?? "Done ✓"} className="psy-btn !px-3 !py-2 !text-[13px]" />
                    </form>
                  )}
                  {d.alt && (
                    <form action={tickMove}>
                      {d.alt.tickIds.map((id) => (
                        <input key={id} type="hidden" name="move" value={id} />
                      ))}
                      <button type="submit" className="psy-btn-ghost !px-3 !py-2 !text-[13px]">{d.alt.label}</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* The chapter's villain, the road and your numbers, under the move (member test, 19 Nov). */}
      <div className="mx-0.5 mt-6">
        {chapter && (
            <div className="relative mt-4 rounded-[14px] border border-[#5b2a3d] bg-[linear-gradient(135deg,#2a1420,#1b1424)] py-3 pl-[50px] pr-4">
              <span
                className="absolute left-3.5 top-3 grid h-[26px] w-[26px] place-items-center rounded-lg bg-[#ff5d73] text-[15px] text-[#2a0b12]"
                aria-hidden="true"
              >
                ⚔
              </span>
              <span className="block font-disp text-[10.5px] font-semibold uppercase tracking-[1.4px] text-[#ff8fa0]">
                The villain this chapter
              </span>
              <b className="mt-px block font-disp text-[15px] font-semibold text-off">{chapter.villain}</b>
              <i className="mt-0.5 block text-[13px] text-sec">&ldquo;{chapter.says}&rdquo;</i>
              <span className="mt-1.5 block text-[13px] text-[#9be7b0]">How you beat it: {chapter.beat}</span>
            </div>
        )}

        {/* The road: seven chapters, from you to your first paying coaching client. */}
        <div className="mt-5 flex items-center" aria-hidden="true">
          {Array.from({ length: totalSessions }, (_, i) => i + 1).map((n) => (
            <span key={n} className="flex flex-1 items-center last:flex-none">
              <span
                className={`grid h-4 w-4 flex-none place-items-center rounded-full border-2 ${
                  n < session ? "border-blue bg-blue" : n === session ? "border-orange bg-orange/25 shadow-[0_0_0_4px_rgba(255,141,30,.18)]" : "border-[#34466e]"
                }`}
              />
              <span className={`mx-1 h-0.5 flex-1 ${n < session ? "bg-blue" : "border-t-2 border-dashed border-[#34466e]"}`} />
            </span>
          ))}
          <span className="ml-1 text-[15px]">🏁</span>
        </div>
        <div className="mt-1.5 flex justify-between text-[10.5px] text-mut">
          <span>You</span>
          <span>First paying coaching client</span>
        </div>

        {list && (
          <a
            href="/portal/outreach"
            className="mt-3 flex items-center gap-3 rounded-[14px] border border-line border-l-[3px] border-l-blue bg-panel px-3.5 py-3 hover:border-[#3b5a92]"
          >
            <span className="min-w-0 flex-1">
              <b className="block font-disp text-[13.5px] font-semibold text-off">
                Your contact list: {list.names}
                {namesMin > list.names ? ` · ${namesMin} needed to finish Session ${session}` : ""} · goal {list.target}
              </b>
              <span className="text-[12.5px] text-sec">
                {list.thisWeek > 0 ? `+${list.thisWeek} this week. ` : ""}Not your current therapy clients. Former therapy clients can go on, only to ask who they know.
              </span>
              <span className="mt-2 block h-1 overflow-hidden rounded-full bg-line">
                <i className="block h-full bg-blue" style={{ width: `${Math.min(100, Math.round((list.names / Math.max(namesMin > list.names ? namesMin : list.target, 1)) * 100))}%` }} />
              </span>
            </span>
            {list.earning && (
              <span className="whitespace-nowrap font-disp text-[12px] font-semibold text-[#7fc0ff]">+10 a name</span>
            )}
          </a>
        )}
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
              {m.finish && !isDone(m) && finish && m !== current && gateOk && (
                <details className="text-right">
                  <summary className="cursor-pointer list-none text-[12px] text-mut underline decoration-dotted underline-offset-2 marker:hidden hover:text-off">
                    Mark done
                  </summary>
                  <div className="text-left">{finish}</div>
                </details>
              )}
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
