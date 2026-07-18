import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FileRow, Profile, Settings, Week } from "@/lib/types";
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

  const [{ data: clients }, { data: weeks }, { data: files }, { data: settings }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("role", "client").order("created_at"),
      supabase.from("weeks").select("*").order("number"),
      supabase.from("files").select("*"),
      supabase.from("settings").select("*").single(),
    ]);

  return (
    <div className="relative z-10 mx-auto max-w-[1060px] px-5 pb-24 pt-7">
      <Header name={me.full_name || "Admin"} role="admin" />
      <AdminDashboard
        clients={(clients ?? []) as Profile[]}
        weeks={(weeks ?? []) as Week[]}
        files={(files ?? []) as FileRow[]}
        settings={settings as Settings}
      />
    </div>
  );
}
