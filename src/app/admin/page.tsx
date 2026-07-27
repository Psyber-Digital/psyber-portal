import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { purgeExpiredSharedFiles } from "@/lib/purge";
import type { FileRow, Profile, Settings, SharedFile, Week } from "@/lib/types";
import { Header } from "../portal/components/Header";
import { AdminDashboard } from "./components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Non-admins get a 404 rather than a redirect that would reveal the route.
  if (me?.role !== "admin") notFound();

  // Lazy sweep: clears the bytes of any expired Shared Files item whenever the
  // dashboard is opened, so the feature self-heals if the hourly Vercel cron is
  // ever missing or misconfigured. Cheap — an indexed query that normally
  // matches nothing. Expiry itself is enforced by RLS, not by this.
  await purgeExpiredSharedFiles().catch((e) =>
    console.error("lazy shared-files purge failed:", e),
  );

  const [
    { data: clients },
    { data: weeks },
    { data: files },
    { data: settings },
    { data: shared },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "client").order("created_at"),
    supabase.from("weeks").select("*").order("number"),
    supabase.from("files").select("*"),
    supabase.from("settings").select("*").single(),
    supabase.from("shared_files").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <div className="relative z-10 mx-auto max-w-[1060px] px-5 pb-24 pt-7">
      <Header name={me.full_name || "Admin"} role="admin" />
      <AdminDashboard
        clients={(clients ?? []) as Profile[]}
        weeks={(weeks ?? []) as Week[]}
        files={(files ?? []) as FileRow[]}
        settings={settings as Settings}
        shared={(shared ?? []) as SharedFile[]}
        serverNow={Date.now()}
      />
    </div>
  );
}
