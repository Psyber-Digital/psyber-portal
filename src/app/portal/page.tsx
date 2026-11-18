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
import { dueMoves, type DueContact } from "@/lib/dueMoves";
import { weekWorkbook, weekResources } from "@/lib/resources";

export const dynamic = "force-dynamic";
const BOOK_ID = "book";

export default async function PortalPage({
  searchParams,
}: {
  searchParams?: { week?: string; joined?: string };
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

  // The first-month offer (0016). Only someone who has never paid has dates here.
  const offerIsOpen = profile?.tier === "foundations" && !profile.lapsed_at && offerOpen(profile);
  const freeFinished =
    profile?.tier === "foundations" && !profile.lapsed_at && Boolean(profile.session1_finished_at);

  const filesFor = (weekId: string) => visibleFiles.filter((f) => f.week_id === weekId);

  // Full program outline for the stepper — every session, including ones not yet
  // published, so the client sees the whole path with remaining sessions greyed out.
  // RLS hides unpublished weeks from clients, so we read the outline with the
  // service-role client (server-only; the access check above has already run).
  // Only number/title/published are selected — no draft content reaches the browser.
  const { data: outlineRows } = await createAdminClient()
    .from("weeks")
    .select("id, number, title, published")
    .order("number");
  const outline = (outlineRows ?? publishedWeeks) as WeekOutline[];

  // "Your next move" (0017; War Room run psyber/2026-11-18-next-move). One
  // card for the current session; the materials below are unchanged.
  const tier = profile?.tier;
  const moves = current ? movesFor(current.number, tier) : [];
  const { data: tickRows } = current
    ? await supabase.from("move_ticks").select("move_id, done_at")
    : { data: [] as { move_id: string; done_at: string }[] };
  const ticked = new Set((tickRows ?? []).map((r) => r.move_id));
  // Dated cards come from the member's own list (owner-only RLS, 0005).
  const { data: contactRows } = current
    ? await supabase
        .from("contacts")
        .select("id, status, correspondence, first_contact_date, last_contact_date, next_followup_date, created_at")
    : { data: [] as DueContact[] };
  const due = current
    ? dueMoves({ contacts: (contactRows ?? []) as DueContact[], session: current.number, tier, ticked })
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
  const showNextMove =
    Boolean(current) && !viewingPast && moves.length > 0 &&
    !(tier === "foundations" && (freeFinished || profile?.lapsed_at));
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
  const finishedThrough =
    tier === "build" ? profile?.completed_week ?? 0
    : tier === "foundations" ? (freeFinished ? 1 : 0)
    : Math.max((current?.number ?? 1) - 1, 0);
  const buildFinishLabel = current?.number === 2
    ? "I\u2019m happy with my niche. Open Session 3"
    : `Mark Session ${current?.number} complete`;

  return (
    <div className="relative z-10 mx-auto max-w-[1060px] px-4 pb-16 pt-6 sm:px-5 sm:pb-24 sm:pt-7">
      <Header name={profile?.full_name || "Client"} role="client" />
      {profile?.tier === "build" && <ScrollTopOnChange value={profile.completed_week ?? 0} />}
      <PortalNav
        badge={uncollected ?? 0}
        clinic={profile?.tier === "build"}
        oneOnOne={profile?.tier === "foundations" || profile?.tier === "build"}
      />

      {/* Straight from Stripe's payment page (billing sends them here). */}
      {profile?.tier === "build" && searchParams?.joined && (
        <p className="mb-6 rounded-[9px] border border-blue/30 bg-blue/10 px-4 py-3 text-sm text-sec">
          Welcome to <Brand name="Build" tm />. Each session you finish opens the next.
        </p>
      )}

      {!hasPassword && <SetPasswordPrompt />}

      {/* Foundations members: the way into Build. WORDING: board card r11,
          re-sold per Codex VOICE-20261030-2 and 20261031-1. */}
      {profile?.tier === "foundations" && offerIsOpen && (
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

      {profile?.tier === "foundations" && !offerIsOpen && (
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

      {/* Redesign (board r01): the move card is the centre. The welcome video
          and the session intro move into the toolkit below it. */}
      {!showNextMove && <WelcomeVideo currentWeek={currentWeek} />}

      {current && !showNextMove && (
        <WelcomeBanner week={current} intro={weekGuide(current.number)?.bannerIntro} />
      )}

      {outline.length > 0 && (
        <Journey
          weeks={outline}
          currentWeek={current?.number ?? currentWeek}
          selected={focused?.number}
          finishedThrough={finishedThrough}
          lockedNote={profile?.tier === "foundations" ? "Sessions 2 to 7 open in Build\u2122" : undefined}
        />
      )}

      {showNextMove && current && (
        <NextMove
          sessionTitle={shortTitle(current.title)}
          session={current.number}
          moves={moves}
          ticked={ticked}
          sessionFinished={sessionFinished}
          meet={meet}
          links={moveLinks}
          due={due}
          finish={
            tier === "build" ? (
              <FinishForm
                action={finishSession}
                week={current.number}
                label={buildFinishLabel}
                lead={current.number === 2 ? <NicheLaneCheck /> : undefined}
              />
            ) : tier === "foundations" ? (
              <FinishForm action={finishSession} week={1} label="Mark Session 1 complete" />
            ) : undefined
          }
        />
      )}

      {current && !viewingPast && badges.length > 0 && (
        <Milestones badges={badges} momentum={momentum} memberKey={user.id.slice(0, 8)} />
      )}

      {showNextMove && current && (
        <>
          <ThisWeekToolkit
            week={current}
            files={filesFor(current.id)}
            intro={weekGuide(current.number)?.bannerIntro}
            welcome={currentWeek <= 1 ? <WelcomeVideo currentWeek={currentWeek} /> : undefined}
          />
          {currentWeek > 1 && <WelcomeVideo currentWeek={currentWeek} />}
        </>
      )}

      {focused ? (
        <>
          {showNextMove ? null : viewingPast ? (
            <div className="mx-0.5 mb-4 mt-9 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="psy-eyebrow whitespace-nowrap text-orange">
                Viewing · Week {pad(focused.number)} — {stripWeekPrefix(focused.title)}
              </span>
              <span className="hidden h-px flex-1 bg-line sm:block" />
              <a
                href="/portal"
                className="psy-eyebrow whitespace-nowrap text-blue hover:underline"
              >
                ← Back to this week
              </a>
            </div>
          ) : (
            <SectionHead>Your work this week</SectionHead>
          )}
          {!showNextMove && <ThisWeek week={focused} files={filesFor(focused.id)} />}

          {/* Build members open the next session themselves (terms 2.2).
              Finishing Session 2 means they're happy with their niche; help
              comes from the weekly drop-in, not an approval (Don, r11, 29 Oct).
              WORDING: board card r11. */}
          {/* Foundations: finishing Session 1 opens nothing, but it starts the
              first-month offer (0016). WORDING: board card m03, 5 Nov 2026. */}
          {profile?.tier === "foundations" && !profile.lapsed_at && !freeFinished && !viewingPast &&
            current?.number === 1 && !(showNextMove && finishInCard) && (
              <FinishForm action={finishSession} week={1} label="Mark Session 1 complete" />
            )}
          {freeFinished && offerIsOpen && (
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

          {profile?.tier === "build" && !viewingPast && current &&
            (profile.completed_week ?? 0) < current.number && !(showNextMove && finishInCard) && (
              <FinishForm
                action={finishSession}
                week={current.number}
                label={
                  current.number === 2
                    ? "I’m happy with my niche. Open Session 3"
                    : `Mark Session ${current.number} complete`
                }
                lead={current.number === 2 ? <NicheLaneCheck /> : undefined}
              />
            )}
        </>
      ) : (
        <div className="psy-card p-10 text-center text-sm text-mut">
          No weeks unlocked yet. Your practitioner will grant access after your first session.
        </div>
      )}

      {/* One-on-one booking is for flagship clients, not self-serve members. */}
      {settings && profile?.tier !== "foundations" && profile?.tier !== "build" && (
        <BookingPanel id={BOOK_ID} settings={settings as Settings} />
      )}
    </div>
  );
}
