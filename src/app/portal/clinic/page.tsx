import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clinicLabel, nextClinic } from "@/lib/clinic";
import { Header } from "../components/Header";
import { PortalNav } from "../components/PortalNav";
import { SectionHead } from "../components/SectionHead";
import { VimeoEmbed } from "../components/VimeoEmbed";

export const dynamic = "force-dynamic";

// The weekly group clinic, for Build members (Offer Ladder stage 5; Build terms
// 2.3 and 7). RLS decides who sees the Zoom link and the recordings (0015); this
// page only chooses what to show. WORDING: approved by Don, board card r23 (29 Oct);
// "clinic" renamed "drop-in" to match Sessions 2 and 6 (Don, Audit card n2a, 29 Oct).
export default async function ClinicPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, tier")
    .eq("id", user.id)
    .single();
  if (profile?.role === "admin") redirect("/admin/clinic");
  if (profile?.tier === "foundations") redirect("/portal/billing");
  if (profile?.tier !== "build") redirect("/portal");

  const [{ data: settings }, { data: recordings }, { count: uncollected }] = await Promise.all([
    supabase.from("clinic_settings").select("zoom_url, notice").maybeSingle(),
    supabase
      .from("clinic_recordings")
      .select("id, clinic_date, title, vimeo_id, vimeo_hash")
      .order("clinic_date", { ascending: false }),
    supabase
      .from("shared_files")
      .select("id", { count: "exact", head: true })
      .eq("direction", "to_client")
      .is("downloaded_at", null),
  ]);

  const { start, live } = nextClinic();

  return (
    <div className="relative z-10 mx-auto max-w-[1060px] px-4 pb-16 pt-6 sm:px-5 sm:pb-24 sm:pt-7">
      <Header name={profile?.full_name || "Member"} role="client" />
      <PortalNav badge={uncollected ?? 0} clinic />

      <SectionHead>The weekly drop-in</SectionHead>
      <div className="psy-card p-6 sm:p-8">
        {settings?.notice && (
          <p className="mb-4 rounded-[9px] border border-orange/40 bg-orange/10 px-3 py-2.5 text-sm text-orange">
            {settings.notice}
          </p>
        )}
        <div className="psy-eyebrow text-blue">{live ? "On now" : "Next drop-in"}</div>
        <h2 className="mt-1 font-disp text-xl font-semibold">{clinicLabel(start)}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          One hour, live on Zoom. Bring what you’re working on: your niche, your
          message, your next step.
        </p>
        {settings?.zoom_url ? (
          <a
            href={settings.zoom_url}
            target="_blank"
            rel="noopener noreferrer"
            className="psy-btn mt-5 inline-block"
          >
            {live ? "Join the drop-in now" : "Join on Zoom"}
          </a>
        ) : (
          <p className="mt-5 text-sm text-slate">The Zoom link appears here before the first drop-in.</p>
        )}
        <p className="mt-5 text-xs leading-relaxed text-slate">
          Drop-ins are recorded for members who miss them. Keep examples general:
          nothing about your therapy clients, and nothing that identifies anyone on
          your contact list.
        </p>
      </div>

      <SectionHead>Recordings</SectionHead>
      {recordings && recordings.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {recordings.map((r) => (
            <div key={r.id} className="psy-card p-4">
              <VimeoEmbed
                video={{ id: r.vimeo_id, hash: r.vimeo_hash || undefined, title: r.title || "Drop-in recording" }}
              />
              <p className="mt-3 text-sm font-semibold">
                {new Date(`${r.clinic_date}T12:00:00Z`).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {r.title ? ` · ${r.title}` : ""}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="psy-card p-6 text-sm text-slate">Recordings of past drop-ins appear here.</div>
      )}
      <p className="mt-3 text-xs text-slate">Recordings stay here for 90 days after each drop-in.</p>
    </div>
  );
}
