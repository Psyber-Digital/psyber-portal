import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FileRow, Settings, Week } from "@/lib/types";
import { weekGuide } from "@/lib/weekGuide";
import { Header } from "./components/Header";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { Stepper } from "./components/Stepper";
import { SectionHead } from "./components/SectionHead";
import { ThisWeek } from "./components/ThisWeek";
import { CompletedWeeks } from "./components/CompletedWeeks";
import { BookingPanel } from "./components/BookingPanel";

export const dynamic = "force-dynamic";
const BOOK_ID = "book";

export default async function PortalPage() {
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
  const completed = unlocked.slice(0, -1).reverse();

  const filesFor = (weekId: string) => visibleFiles.filter((f) => f.week_id === weekId);

  return (
    <div className="relative z-10 mx-auto max-w-[1060px] px-5 pb-24 pt-7">
      <Header name={profile?.full_name || "Client"} role="client" />

      {current && (
        <WelcomeBanner week={current} intro={weekGuide(current.number)?.bannerIntro} />
      )}

      {publishedWeeks.length > 0 && <Stepper weeks={publishedWeeks} currentWeek={currentWeek} />}

      {current ? (
        <>
          <SectionHead>Your work this week</SectionHead>
          <ThisWeek week={current} files={filesFor(current.id)} />
        </>
      ) : (
        <div className="psy-card p-10 text-center text-sm text-mut">
          No weeks unlocked yet. Your practitioner will grant access after your first session.
        </div>
      )}

      {completed.length > 0 && (
        <>
          <SectionHead>Completed weeks</SectionHead>
          <CompletedWeeks weeks={completed} filesFor={filesFor} />
        </>
      )}

      {settings && <BookingPanel id={BOOK_ID} settings={settings as Settings} />}
    </div>
  );
}
