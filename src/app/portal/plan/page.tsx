import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "../components/Header";
import { PortalNav } from "../components/PortalNav";
import { SectionHead } from "../components/SectionHead";
import { weekWorkbook } from "@/lib/resources";
import { CHAPTERS } from "@/lib/story";
import { PlanView, type PlanSession } from "./PlanView";

// "My coaching plan" (Don, card AD2, 25 Nov 2026; IKEA effect: people value
// what they have built themselves). Every Working Sheet answer, gathered into
// one plan. Answers live in this browser, where the sheets save them; nothing
// new is stored. Sessions not yet open show greyed, as the rest of the plan.
export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role === "admin") redirect("/admin");

  const tier = profile?.tier as string | undefined;
  const open = profile?.access_week ?? 0;
  const sessions: PlanSession[] = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    number: n,
    title: CHAPTERS[n]?.title ?? `Session ${n}`,
    sheet: n === 1 ? "/session-01/Session-01-Working-Sheet.html" : weekWorkbook(n)?.href,
    // Build Free's Session 2 preview is open too once Session 1 is done (lane-guard, 25 Nov 2026).
    open: n <= open || (n === 2 && tier === "foundations" && Boolean(profile?.session1_finished_at)),
    key: `psyberB-wk${n}`,
  }));

  return (
    <div className="relative z-10 mx-auto max-w-[1060px] px-4 pb-16 pt-6 sm:px-5 sm:pb-24 sm:pt-7">
      <Header name={profile?.full_name || "Client"} role="client" />
      <PortalNav clinic={tier === "build"} oneOnOne={tier === "foundations" || tier === "build"} />
      <SectionHead>My coaching plan</SectionHead>
      <p className="mx-0.5 mb-5 max-w-[70ch] text-[13.5px] leading-relaxed text-mut">
        Everything you&rsquo;ve built, in one place. Each Working Sheet you fill in adds a chapter to your plan.
      </p>
      <PlanView sessions={sessions} free={tier === "foundations"} />
    </div>
  );
}
