import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FileRow, Settings, Week } from "@/lib/types";
import { Header } from "./components/Header";
import { Stepper } from "./components/Stepper";
import { BookingPanel } from "./components/BookingPanel";
import { WeekCard, LockedCard } from "./components/WeekCard";

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

  const unlocked = publishedWeeks.filter((w) => w.number <= currentWeek);
  const locked = publishedWeeks.filter((w) => w.number > currentWeek);
  const filesFor = (weekId: string) =>
    visibleFiles.filter((f) => f.week_id === weekId);

  return (
    <div className="relative z-10 mx-auto max-w-[1060px] px-5 pb-24 pt-7">
      <Header name={profile?.full_name || "Client"} role="client" />

      {publishedWeeks.length > 0 && (
        <Stepper weeks={publishedWeeks} currentWeek={currentWeek} onBookId={BOOK_ID} />
      )}

      {settings && <BookingPanel id={BOOK_ID} settings={settings as Settings} />}

      <p className="psy-eyebrow mb-4">Your unlocked weeks</p>
      <div className="grid gap-4">
        {unlocked.length ? (
          unlocked.map((w) => (
            <WeekCard key={w.id} week={w} files={filesFor(w.id)} />
          ))
        ) : (
          <div className="psy-card p-10 text-center text-sm text-dim">
            No weeks unlocked yet. Your practitioner will grant access after your
            first session.
          </div>
        )}
      </div>

      {locked.length > 0 && (
        <>
          <p className="psy-eyebrow mb-4 mt-9">Upcoming</p>
          <div className="grid gap-4">
            {locked.map((w) => (
              <LockedCard key={w.id} week={w} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
