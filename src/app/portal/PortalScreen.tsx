import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FileRow, Settings, Week, WeekOutline } from "@/lib/types";
import { weekGuide } from "@/lib/weekGuide";
import { Header } from "./components/Header";
import { WelcomeVideo } from "./components/WelcomeVideo";
import { PortalNav } from "./components/PortalNav";
import { SetPasswordPrompt } from "./components/SetPasswordPrompt";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { SectionHead } from "./components/SectionHead";
import { ThisWeek } from "./components/ThisWeek";
import { BookingPanel } from "./components/BookingPanel";
import { pad, stripWeekPrefix } from "@/lib/week";
import { touchActivity } from "@/lib/activity";
import { finishSession } from "./finishActions";
import { finishCore } from "@/lib/finishCore";
import { deadlineDay, offerOpen, STRATEGY_CALL_URL } from "@/lib/upsellEmails";
import { FinishForm } from "./components/FinishForm";
import { NicheLaneCheck } from "./components/NicheLaneCheck";
import { ScrollTopOnChange } from "./components/ScrollTopOnChange";
import { Brand } from "./components/Brand";
import { NextMove, type MoveLinks } from "./components/NextMove";
import { Journey, shortTitle } from "./components/Journey";
import { Milestones } from "./components/Milestones";
import { ThisWeekToolkit } from "./components/ThisWeek";
import { badgesOf, badgeTickId, momentumOf } from "@/lib/milestones";
import { movesFor } from "@/lib/moves";
import { dueMoves, easternToday, type DueContact } from "@/lib/dueMoves";
import { weekWorkbook, weekResources } from "@/lib/resources";
import { cookies } from "next/headers";
import { PARK_COOKIE } from "@/lib/moves";
import { weekVideo } from "@/lib/videos";
import { VimeoEmbed } from "./components/VimeoEmbed";
import { ChapterFinish } from "./components/ChapterFinish";
import { CHAPTERS } from "@/lib/story";
import { movePoints, namesThisWeek, pointTicksToKeep, pointsTotal } from "@/lib/points";
import { sessionGate } from "@/lib/gates";
import { buildOnSale, OPENS_SOON, SAVING_WAITS } from "@/lib/sale";
import { currentStep, PRICE, savingWaiting } from "@/lib/ladder";
import { Countdown } from "./components/Countdown";

const BOOK_ID = "book";

// One page, two views (structure A, board m10, 18 Nov 2026): "today" is the
// move card with progress under it (m16); "program" holds the journey and
// every session's materials. The program route renders this same component,
// so the facts load once.
export type PortalView = "today" | "program";

export async function PortalScreen({
  searchParams,
  view = "today",
}: {
  searchParams?: { week?: string; joined?: string; move?: string; opened?: string };
  view?: PortalView;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin");

  // Completion machinery: record that the client actually moved. Throttled and
  // silent — see src/lib/activity.ts.
  await touchActivity(user.id, profile?.role, profile?.last_activity_at);

  // Prompt users who haven't set a password yet (flag stamped on their auth
  // metadata when they save one via /portal/account).
  const hasPassword = user.user_metadata?.has_password === true;

  // How far they may see, not how far they have got: Foundations is capped at
  // Session 1 even if a lapsed Build member had gone further (0010).
  const currentWeek = profile?.access_week ?? 0;

  // RLS returns only published weeks; files returns only entitled rows. The
  // shared-files count powers the nav badge — RLS already excludes expired items,
  // so this counts only what's genuinely still collectable.
  const [{ data: weeks }, { data: files }, { data: settings }, { count: uncollected }] =
    await Promise.all([
      supabase.from("weeks").select("*").order("number"),
      supabase.from("files").select("*"),
      supabase.from("settings").select("*").single(),
      supabase
        .from("shared_files")
        .select("id", { count: "exact", head: true })
        .eq("direction", "to_client")
        .is("downloaded_at", null),
    ]);

  const publishedWeeks = (weeks ?? []) as Week[];
  const visibleFiles = (files ?? []) as FileRow[];

  const unlocked = publishedWeeks
    .filter((w) => w.number <= currentWeek)
    .sort((a, b) => a.number - b.number);
  // The current week gets the full treatment; earlier weeks collapse below it.
  const current = unlocked[unlocked.length - 1];
  // A week can be opened from the Program stepper (?week=N); default to the current week.
  const selectedNum = Number(searchParams?.week);
  const focused = unlocked.find((w) => w.number === selectedNum) ?? current;
  const viewingPast = Boolean(focused && current && focused.number !== current.number);
  // Another session's materials live on the Program page now.
  if (view === "today" && viewingPast && focused) redirect(`/portal/program?week=${focused.number}`);

  // The first-month offer (0016). Only someone who has never paid has dates here.
  const offerIsOpen = profile?.tier === "foundations" && !profile.lapsed_at && offerOpen(profile);
  const ladderStep = profile?.tier === "foundations" ? currentStep(profile) : null;
  const freeFinished =
    profile?.tier === "foundations" && !profile.lapsed_at && Boolean(profile.session1_finished_at);

  const filesFor = (weekId: string) => visibleFiles.filter((f) => f.week_id === weekId);

  // Full program outline for the stepper — every session, including ones not yet
  // published, so the client sees the whole path with remaining sessions greyed out.
  // RLS hides unpublished weeks from clients, so we read the outline with the
  // service-role client (server-only; the access check above has already run).
  // Only number/title/published are selected — no draft content reaches the browser.
  // These four reads run side by side, not one after another: each one is a
  // trip to the database, and in a row they made switching tabs lag (Don, card
  // BT1, 24 Nov 2026).
  const tier = profile?.tier;
  const moves = current ? movesFor(current.number, tier) : [];
  // Kept points (s1-p-) are read separately, a page at a time, so a member
  // with hundreds of them never pushes real ticks past the API's row limit.
  const readPoints = async () => {
    const rows: { move_id: string; done_at: string }[] = [];
    if (!current) return rows;
    for (let from = 0; from < 20000; from += 1000) {
      const { data: page, error: pageErr } = await supabase
        .from("move_ticks")
        .select("move_id, done_at")
        .like("move_id", "s1-p-%")
        .order("move_id")
        .range(from, from + 999);
      if (pageErr) {
        console.error("read points failed:", pageErr.message);
        break;
      }
      rows.push(...(page ?? []));
      if (!page || page.length < 1000) break;
    }
    return rows;
  };
  const [{ data: outlineRows }, { data: tickRows }, pointRows, { data: contactRows }] = await Promise.all([
    // Full program outline for the stepper — every session, including ones not yet
    // published, so the client sees the whole path with remaining sessions greyed out.
    // RLS hides unpublished weeks from clients, so we read the outline with the
    // service-role client (server-only; the access check above has already run).
    // Only number/title/published are selected — no draft content reaches the browser.
    createAdminClient().from("weeks").select("id, number, title, published").order("number"),
    // "Your next move" (0017; War Room run psyber/2026-11-18-next-move).
    current
      ? supabase.from("move_ticks").select("move_id, done_at").not("move_id", "like", "s1-p-%")
      : Promise.resolve({ data: [] as { move_id: string; done_at: string }[] }),
    readPoints(),
    // Dated cards come from the member's own list (owner-only RLS, 0005).
    current
      ? supabase
          .from("contacts")
          .select("id, name, status, correspondence, first_contact_date, last_contact_date, next_followup_date, created_at")
      : Promise.resolve({ data: [] as DueContact[] }),
  ]);
  const outline = (outlineRows ?? publishedWeeks) as WeekOutline[];
  const ticked = new Set((tickRows ?? []).map((r) => r.move_id));
  const due = current
    ? dueMoves({
        contacts: (contactRows ?? []) as DueContact[],
        session: current.number,
        tier,
        ticked,
        listMoveOpen: moves.some((m) => m.opens === "list" && /-list$/.test(m.id) && !ticked.has(m.id)),
      })
    : [];
  const sessionFinished =
    tier === "build"
      ? (profile?.completed_week ?? 0) >= (current?.number ?? 0)
      : tier === "foundations"
        ? freeFinished
        : false;
  const nextMove = moves.find((m) => (m.finish ? !sessionFinished : !ticked.has(m.id)));
  // The finish button moves into the card when it is the next move, so the
  // page never shows it twice.
  const finishInCard = Boolean(nextMove?.finish);
  // Everyone gets the new Today, one-on-one clients included (Don, card L3 = B,
  // 21 Nov 2026). NEXT_MOVE_FOR_ONE_ON_ONE="false" holds it back from them.
  const nextMoveForTier =
    tier === "foundations" || tier === "build" || process.env.NEXT_MOVE_FOR_ONE_ON_ONE !== "false";
  const showNextMove =
    nextMoveForTier && Boolean(current) && !viewingPast && moves.length > 0 &&
    !(tier === "foundations" && (freeFinished || profile?.lapsed_at));
  // On Today the countdown sits at the top; elsewhere it sits with the banners.
  const countdownOnTop = view === "today" && showNextMove && Boolean(ladderStep);
  const moveLinks: MoveLinks = current
    ? {
        video: "#watch",
        // Session 1's moves follow the updated Working Sheet's three blocks.
        sheet: current.number === 1
          ? "/session-01/Session-01-Working-Sheet.html"
          : weekWorkbook(current.number)?.href,
        card: weekResources(current.number).find((r) => r.label === "The Principle Card")?.href,
        list: "/portal/outreach",
        shared: "/portal/shared",
      }
    : {};
  const parked = new Set((cookies().get(PARK_COOKIE)?.value ?? "").split(",").filter(Boolean));
  const currentVideo = current ? weekVideo(current.number) : undefined;
  // Foundations has no drop-in (ADR-0027): an empty meet shows the Build line instead.
  const meet = tier === "build" ? "the drop-in" : tier === "foundations" ? "" : "our next call";

  // Momentum and milestones (board r01). A badge, once earned, is kept as a
  // tick, so taking a name off the list never takes a badge away.
  const contactsList = (contactRows ?? []) as DueContact[];
  const momentum = momentumOf(tickRows ?? [], contactsList.length);
  const badges = profile
    ? badgesOf(profile, contactsList, momentum, ticked)
    : [];
  const toKeep = badges.filter((b) => b.earned && !ticked.has(badgeTickId(b.key)));
  if (toKeep.length && user) {
    const { error: keepErr } = await supabase
      .from("move_ticks")
      .upsert(toKeep.map((b) => ({ user_id: user.id, move_id: badgeTickId(b.key) })), {
        onConflict: "user_id,move_id",
        ignoreDuplicates: true,
      });
    if (keepErr) console.error("keep badges failed:", keepErr.message);
  }
  // Points (board m18, 19 Nov 2026): each one is kept as a tick the first time
  // Today or Program sees it earned, under the member's own login, so they only
  // go up. Unticking a move does take that move's own points back.
  const nameTarget = tier === "foundations" ? 50 : 250;
  // The next session opens by itself once every move is done and the list has
  // its names: no extra button (Don, cards BT1 and S2, 25 Nov 2026: "Session 2
  // still doesn't open"). Session 2 keeps its button, because it asks the lane
  // question; Session 7 keeps its button, because it ends the program.
  const autoFinish =
    view === "today" && Boolean(current) && !viewingPast && !sessionFinished &&
    (tier === "build" ? ![2, 7].includes(current!.number) : tier === "foundations" ? current!.number === 1 : false);
  if (autoFinish && sessionGate(current!.number, moves, ticked, contactsList.length, nameTarget === 50 ? 50 : undefined).ok) {
    const result = await finishCore(current!.number);
    if (result === "opened" || result === "finished_free" || result === "last") {
      redirect(`/portal?opened=${current!.number}`);
    }
  }
  const newPointTicks = current ? pointTicksToKeep(contactsList, [...(tickRows ?? []), ...pointRows], nameTarget) : [];
  let keptPointTicks: string[] = [];
  if (newPointTicks.length && user) {
    const { error: ptsErr } = await supabase
      .from("move_ticks")
      .upsert(newPointTicks.map((move_id) => ({ user_id: user.id, move_id })), {
        onConflict: "user_id,move_id",
        ignoreDuplicates: true,
      });
    if (ptsErr) console.error("keep points failed:", ptsErr.message);
    else keptPointTicks = newPointTicks;
  }
  const points = pointsTotal([...(tickRows ?? []), ...pointRows, ...keptPointTicks.map((move_id) => ({ move_id }))]);

  // The encouragement line: the move ticked in the last three minutes.
  const recent = (tickRows ?? [])
    .filter((t) => moves.some((m) => m.id === t.move_id) && Date.now() - new Date(t.done_at).getTime() < 3 * 60 * 1000)
    .sort((a, b) => b.done_at.localeCompare(a.done_at))[0];
  const recentMove = recent ? moves.find((m) => m.id === recent.move_id) : undefined;
  const justDone = recentMove ? { title: recentMove.title, points: movePoints(recentMove) } : null;

  // Back after a week or more. last_activity_at is read before this visit stamps it.
  const lastSeen = profile?.last_activity_at ? new Date(profile.last_activity_at).getTime() : null;
  const welcomeBack = lastSeen !== null && Date.now() - lastSeen > 7 * 24 * 60 * 60 * 1000;

  const finishedThrough =
    tier === "build" ? profile?.completed_week ?? 0
    : tier === "foundations" ? (freeFinished ? 1 : 0)
    : Math.max((current?.number ?? 1) - 1, 0);
  const buildFinishLabel = current?.number === 2
    ? "I\u2019m happy with my niche. Open Session 3"
    : `Mark Session ${current?.number} complete`;

  // Set-a-password and the Build offer. Above the page as before, but below
  // the toolkit when the move card is showing, so the card comes first
  // (clarity pass, board m10, 18 Nov).
  const banners = (
    <>
      {!hasPassword && <SetPasswordPrompt />}

      {/* Foundations members: the way into Build. WORDING: board card r11,
          re-sold per Codex VOICE-20261030-2 and 20261031-1. */}
      {false && profile?.tier === "foundations" && buildOnSale() && offerIsOpen && (
        <a
          href="/portal/billing"
          className="psy-card mb-6 flex flex-wrap items-center justify-between gap-3 p-5"
        >
          <span className="text-sm text-slate">
            Your first month of <Brand name="Build" tm /> is $99 until {deadlineDay(profile.offer_ends_at!)},
            then $149 a month, renewing automatically until you cancel.
          </span>
          <span className="psy-btn">Claim it</span>
        </a>
      )}

      {/* The launch ladder countdown (Don, 21 Nov 2026, ADR-0027 addendum 6):
          prominent in the free version, counted from sign-up. */}
      {profile?.tier === "foundations" && ladderStep && !countdownOnTop && (
        <Countdown
          endsAt={ladderStep.endsAt.toISOString()}
          off={ladderStep.off}
          nextOff={ladderStep.next?.off}
          yearly={PRICE.yearly}
          onSale={buildOnSale()}
        />
      )}
      {/* Not twice: the Session 1 finished card carries this line on Today. */}
      {profile?.tier === "foundations" && !ladderStep && !buildOnSale() &&
        !(view === "today" && freeFinished && !profile?.wants_one_on_one) && (
        <p className="psy-card mb-6 p-5 text-sm text-slate">
          {profile && savingWaiting(profile) ? SAVING_WAITS : OPENS_SOON}
        </p>
      )}

      {profile?.tier === "foundations" && buildOnSale() && !ladderStep && (
        <a
          href="/portal/billing"
          className="psy-card mb-6 flex flex-wrap items-center justify-between gap-3 p-5"
        >
          <span className="text-sm text-slate">
            <span className="font-semibold text-off">Go it alone, and avoid the pitfalls.</span>{" "}
            <Brand name="Build" tm /> gives you a clear roadmap, every session and all its resources,
            plus a live drop-in every week. Take your program from first idea to ready to sell.
          </span>
          <span className="psy-btn">Join Build™</span>
        </a>
      )}

    </>
  );

  const finishNode = current
    ? tier === "build" ? (
        <FinishForm
          action={finishSession}
          week={current.number}
          label={buildFinishLabel}
          lead={current.number === 2 ? <NicheLaneCheck /> : undefined}
        />
      ) : tier === "foundations" ? (
        <FinishForm action={finishSession} week={1} label="Mark Session 1 complete" />
      ) : undefined
    : undefined;

  // The session's materials and the ways to finish it: the Program page, and
  // the fallback when there is no move card (a finished free member, say).
  const sessionWork = focused ? (
    <>
      {focused.number !== current?.number ? (
        <div className="mx-0.5 mb-1 mt-7 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="psy-eyebrow whitespace-nowrap text-orange">
            Viewing · Session {pad(focused.number)} — {shortTitle(focused.title)}
          </span>
          <span className="hidden h-px flex-1 bg-line sm:block" />
          <a href="/portal/program" className="psy-eyebrow whitespace-nowrap text-blue hover:underline">
            ← Back to this session
          </a>
        </div>
      ) : null}
      <ThisWeekToolkit
        week={focused}
        files={filesFor(focused.id)}
        intro={weekGuide(focused.number)?.bannerIntro}
        welcome={currentWeek <= 1 ? <WelcomeVideo currentWeek={currentWeek} /> : undefined}
        free={tier === "foundations"}
      />
      {currentWeek > 1 && <WelcomeVideo currentWeek={currentWeek} />}

      {/* Build members open the next session themselves (terms 2.2).
          Finishing Session 2 means they're happy with their niche; help
          comes from the weekly drop-in, not an approval (Don, r11, 29 Oct).
          WORDING: board card r11. */}
      {/* Foundations: finishing Session 1 opens nothing, but it starts the
          first-month offer (0016). WORDING: board card m03, 5 Nov 2026. */}
      {/* Finishing a session happens on Today: the card's last move, or "Mark
          done" in its list (Don, board m10b A, 18 Nov 2026). */}
      {false && freeFinished && offerIsOpen && buildOnSale() && (
        <div className="psy-card mt-6 p-5">
          <p className="font-disp text-base font-semibold text-off">
            Session 1 done. Next is Session 2: your niche.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            Your first month of <Brand name="Build" tm /> is $99 instead of $149 until{" "}
            {deadlineDay(profile!.offer_ends_at!)}. This offer doesn’t come back.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate">
            Then it’s $149 a month, renewing automatically until you cancel. Cancel online any time.
          </p>
          <a href="/portal/billing" className="psy-btn mt-4 inline-block">Claim my $99 first month</a>
        </div>
      )}
      {freeFinished && !profile?.offer_started_at && profile?.wants_one_on_one && (
        <div className="psy-card mt-6 p-5">
          <p className="font-disp text-base font-semibold text-off">
            Session 1 done. Your next step is a call about one-on-one support.
          </p>
          <a href={STRATEGY_CALL_URL} target="_blank" rel="noopener" className="psy-btn mt-4 inline-block">
            Book a call
          </a>
        </div>
      )}
    </>
  ) : (
    <div className="psy-card mt-6 p-10 text-center text-sm text-mut">
      No weeks unlocked yet. Your practitioner will grant access after your first session.
    </div>
  );

  const journey = outline.length > 0 && (
    <Journey
      weeks={outline}
      currentWeek={current?.number ?? currentWeek}
      selected={focused?.number}
      finishedThrough={finishedThrough}
      lockedNote={profile?.tier === "foundations" ? "Sessions 2 to 7 open in Build\u2122" : undefined}
      linkBase="/portal/program"
    />
  );

  const booking = settings && profile?.tier !== "foundations" && profile?.tier !== "build" && (
    <BookingPanel id={BOOK_ID} settings={settings as Settings} />
  );

  return (
    <div className="relative z-10 mx-auto max-w-[1060px] px-4 pb-16 pt-6 sm:px-5 sm:pb-24 sm:pt-7">
      <Header name={profile?.full_name || "Client"} role="client" />
      {profile?.tier === "build" && <ScrollTopOnChange value={profile.completed_week ?? 0} />}
      <PortalNav
        badge={uncollected ?? 0}
        clinic={profile?.tier === "build"}
        oneOnOne={profile?.tier === "foundations" || profile?.tier === "build"}
      />

      {/* The session just finished by itself (Don, BT1 and S2, 25 Nov 2026). */}
      {view === "today" && searchParams?.opened && Number(searchParams.opened) >= 1 && (
        <p className="mb-6 rounded-xl border border-[#2f6b45] bg-[#13281c] px-4 py-3 text-[15px] text-[#c8f3d5]" role="status">
          <b className="font-semibold text-[#9be7b0]">Session {Number(searchParams.opened)} finished!</b>{" "}
          {tier === "build" ? (
            <>Session {Number(searchParams.opened) + 1} is open. Here&rsquo;s your next move.</>
          ) : (
            <>Sessions 2 to 7, and the weekly drop-in, open in <Brand name="Build" tm />.</>
          )}
        </p>
      )}

      {/* Straight from Stripe's payment page (billing sends them here). */}
      {profile?.tier === "build" && searchParams?.joined && (
        <p className="mb-6 rounded-[9px] border border-blue/30 bg-blue/10 px-4 py-3 text-sm text-sec">
          Welcome to <Brand name="Build" tm />. Each session you finish opens the next.
        </p>
      )}

      {view === "today" && showNextMove && current && (
        <div className="mx-auto max-w-[720px]">
          {/* Prominent: the first thing a free member sees (Don, 21 Nov 2026). */}
          {countdownOnTop && ladderStep && (
            <div className="mt-5">
              <Countdown
          endsAt={ladderStep.endsAt.toISOString()}
          off={ladderStep.off}
          nextOff={ladderStep.next?.off}
          yearly={PRICE.yearly}
          onSale={buildOnSale()}
        />
            </div>
          )}
          <NextMove
            session={current.number}
            sessionName={shortTitle(current.title)}
            totalSessions={outline.length || 7}
            media={currentVideo ? <VimeoEmbed video={currentVideo} title={current.title} /> : undefined}
            parked={parked}
            moves={moves}
            ticked={ticked}
            sessionFinished={sessionFinished}
            meet={meet}
            links={{ ...moveLinks, video: "/portal/program#watch" }}
            due={due}
            finish={finishNode}
            chapter={CHAPTERS[current.number]}
            points={points}
            justDone={justDone}
            welcomeBack={welcomeBack}
            namesMin={sessionFinished || (tier !== "build" && tier !== "foundations") ? 0 : sessionGate(current.number, moves, ticked, contactsList.length, nameTarget === 50 ? 50 : undefined).namesMin}
            gate={sessionGate(current.number, moves, ticked, contactsList.length, nameTarget === 50 ? 50 : undefined)}
            viewId={searchParams?.move}
            tickedToday={new Set((tickRows ?? []).filter((t) => easternToday(new Date(t.done_at)) === easternToday()).map((t) => t.move_id))}
            list={{
              names: contactsList.length,
              target: nameTarget,
              thisWeek: namesThisWeek(contactsList),
              // Name points stop at the target, so the tag goes too.
              earning: pointRows.filter((r) => r.move_id.startsWith("s1-p-n-")).length + keptPointTicks.filter((id) => id.startsWith("s1-p-n-")).length < nameTarget,
            }}
          />
          {/* Progress sits under the card (Don, board m16, 18 Nov 2026:
              "gamification keeps them motivated"). Its pop-up comes with it. */}
          {badges.length > 0 && (
            <Milestones badges={badges} momentum={momentum} memberKey={user.id.slice(0, 8)} />
          )}
          {/* The level-up. Never for Foundations: their Session 1 finish starts the $99 offer. */}
          {finishedThrough >= 1 && CHAPTERS[finishedThrough] && (
            <ChapterFinish
              finishedThrough={finishedThrough}
              enabled={tier !== "foundations"}
              memberKey={user.id.slice(0, 8)}
              names={contactsList.length}
              points={points}
              info={{
                number: finishedThrough,
                villain: CHAPTERS[finishedThrough].villain,
                done: CHAPTERS[finishedThrough].done,
                moves: movesFor(finishedThrough, tier).length,
                next: CHAPTERS[finishedThrough + 1]
                  ? {
                      number: finishedThrough + 1,
                      title: CHAPTERS[finishedThrough + 1].title,
                      villain: CHAPTERS[finishedThrough + 1].villain,
                    }
                  : undefined,
              }}
            />
          )}
          <p className="mt-6 text-center text-[13px] text-mut">
            Your program and The List are in the menu above.
          </p>
          <div className="mt-6">{banners}</div>
          {booking}
        </div>
      )}

      {view === "today" && !showNextMove && (
        <>
          {/* Session 1 done on Build Free: celebrate, then the next move is
              joining Build (Don, card BT1, 25 Nov 2026: "a card that
              congratulates them for finishing and then give them the next task
              as signing up to Build Full ... keep the momentum going").
              One-on-one choosers get their call card instead. */}
          {tier === "foundations" && freeFinished && !profile?.wants_one_on_one && (
            <div className="mx-auto mt-2 max-w-[720px]">
              <section className="overflow-hidden rounded-[22px] border border-[#ffb36b] bg-[linear-gradient(160deg,#FFA54A_0%,#FF8D1E_45%,#E8780F_100%)] p-6 text-[#1a0d00] shadow-card sm:p-8">
                <div className="font-disp text-[11px] font-semibold uppercase tracking-[1.6px] text-[#4a2600]">
                  Chapter 1 complete 🎉
                </div>
                <h2 className="mt-1 font-disp text-[26px] font-semibold leading-tight sm:text-[32px]">
                  You cleared the road!
                </h2>
                <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-[#2e1700]">{CHAPTERS[1].done}</p>
                <div className="mt-5 rounded-xl bg-[#0B1220] p-5 text-off">
                  <div className="font-disp text-[11px] font-semibold uppercase tracking-[1.6px] text-orange">Your next move</div>
                  <p className="mt-1 font-disp text-[20px] font-semibold leading-snug">
                    Join <Brand name="Build" tm /> and keep your momentum going!
                  </p>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-sec">
                    Chapter 2 is waiting: choose your niche and beat {CHAPTERS[2].villain}. Sessions 2 to 7, a live
                    drop-in every week, and room for your whole list.
                  </p>
                  {buildOnSale() ? (
                    <a href="/portal/billing" className="psy-btn mt-4 inline-block">Join <Brand name="Build" tm /> now</a>
                  ) : (
                    <>
                      <p className="mt-3 text-[14px] text-off">
                        {profile && savingWaiting(profile) ? SAVING_WAITS : OPENS_SOON}
                      </p>
                      <a href="/build" target="_blank" rel="noopener" className="psy-btn mt-4 inline-block">See what&rsquo;s in <Brand name="Build" tm /></a>
                    </>
                  )}
                </div>
              </section>
            </div>
          )}
          {banners}
          {journey}
          {sessionWork}
          {booking}
        </>
      )}

      {view === "program" && (
        <>
          {journey}
          {sessionWork}
          {booking}
          <div className="mt-6">{banners}</div>
        </>
      )}

    </div>
  );
}
