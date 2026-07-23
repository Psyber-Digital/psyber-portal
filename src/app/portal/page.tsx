import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FileRow, Settings, Week, WeekOutline } from "@/lib/types";
import { weekGuide } from "@/lib/weekGuide";
import { Header } from "./components/Header";
import { SetPasswordPrompt } from "./components/SetPasswordPrompt";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { Stepper } from "./components/Stepper";
import { SectionHead } from "./components/SectionHead";
import { ThisWeek } from "./components/ThisWeek";
import { BookingPanel } from "./components/BookingPanel";
import { pad, stripWeekPrefix } from "@/lib/week";

export const dynamic = "force-dynamic";
const BOOK_ID = "book";

export default async function PortalPage({
  searchParams,
}: {
  searchParams?: { week?: string };
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

  // Prompt users who haven't set a password yet (flag stamped on their auth
  // metadata when they save one via /portal/account).
  const hasPassword = user.user_metadata?.has_password === true;

  const currentWeek = profile?.current_week ?? 0;

  // RLS returns only published weeks; files returns only entitled rows.
  const [{ data: weeks }, { data: files }, { data: settings }] = await Promise.all([
    supabase.from("weeks").select("*").order("number"),
    supabase.from("files").select("*"),
    supabase.from("settings").select("*").single(),
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

  return (
    <div className="relative z-10 mx-auto max-w-[1060px] px-4 pb-16 pt-6 sm:px-5 sm:pb-24 sm:pt-7">
      <Header name={profile?.full_name || "Client"} role="client" />

      {!hasPassword && <SetPasswordPrompt />}

      {current && (
        <WelcomeBanner week={current} intro={weekGuide(current.number)?.bannerIntro} />
      )}

      {outline.length > 0 && (
        <Stepper
          weeks={outline}
          currentWeek={current?.number ?? currentWeek}
          selected={focused?.number}
        />
      )}

      {focused ? (
        <>
          {viewingPast ? (
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
          <ThisWeek week={focused} files={filesFor(focused.id)} />
        </>
      ) : (
        <div className="psy-card p-10 text-center text-sm text-mut">
          No weeks unlocked yet. Your practitioner will grant access after your first session.
        </div>
      )}

      {settings && <BookingPanel id={BOOK_ID} settings={settings as Settings} />}
    </div>
  );
}
