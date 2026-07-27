import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SharedFile } from "@/lib/types";
import { Header } from "../components/Header";
import { PortalNav } from "../components/PortalNav";
import { SectionHead } from "../components/SectionHead";
import { SharedFilesView } from "./SharedFilesView";

export const dynamic = "force-dynamic";

export default async function SharedFilesPage() {
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

  // RLS does the filtering: only this client's rows, and only coach→client items
  // that haven't expired. Nothing here re-checks it in application code, because
  // application code isn't the gate.
  const { data } = await supabase
    .from("shared_files")
    .select("*")
    .order("created_at", { ascending: false });

  const all = (data ?? []) as SharedFile[];
  const fromCoach = all.filter((f) => f.direction === "to_client");
  const sent = all.filter((f) => f.direction === "to_coach");
  const uncollected = fromCoach.filter((f) => !f.downloaded_at).length;

  return (
    <div className="relative z-10 mx-auto max-w-[1060px] px-4 pb-16 pt-6 sm:px-5 sm:pb-24 sm:pt-7">
      <Header name={profile?.full_name || "Client"} role="client" />
      <PortalNav badge={uncollected} />

      <SectionHead>Shared Files</SectionHead>
      <p className="mx-0.5 mb-5 max-w-[70ch] text-[13.5px] leading-relaxed text-mut">
        Documents move both ways here. Anything we send you is available for a
        limited window and then removed. Anything you send stays until we clear
        it.
      </p>

      <SharedFilesView fromCoach={fromCoach} sent={sent} serverNow={Date.now()} />
    </div>
  );
}
