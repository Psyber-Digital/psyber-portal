import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clinicLabel, nextClinic } from "@/lib/clinic";
import { Header } from "../../portal/components/Header";
import { RecordingForm, SettingsForm } from "./ClinicForms";
import { removeRecording } from "./actions";

export const dynamic = "force-dynamic";

// Don's clinic controls: the Zoom link, a notice for members, and recordings.
export default async function AdminClinicPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  // Non-admins get a 404 rather than a redirect that would reveal the route.
  if (me?.role !== "admin") notFound();

  const [{ data: settings }, { data: recordings }] = await Promise.all([
    supabase.from("clinic_settings").select("zoom_url, notice").maybeSingle(),
    supabase.from("clinic_recordings").select("id, clinic_date, title, vimeo_id").order("clinic_date", { ascending: false }),
  ]);
  const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);

  return (
    <div className="relative z-10 mx-auto max-w-[760px] px-4 pb-16 pt-6 sm:px-5">
      <Header name={me?.full_name || "Admin"} role="admin" />
      <p className="mb-4 text-sm">
        <Link href="/admin" className="font-semibold text-blue">← Admin</Link>
      </p>
      <h1 className="font-disp text-xl font-semibold">Weekly clinic</h1>
      <p className="mb-5 mt-1 text-sm text-slate">Next: {clinicLabel(nextClinic().start)}. Build members only.</p>

      <SettingsForm zoom={settings?.zoom_url ?? ""} notice={settings?.notice ?? ""} />

      <h2 className="mb-3 mt-8 font-disp text-base font-semibold">Recordings</h2>
      <p className="mb-3 text-sm text-slate">
        Upload to Vimeo as private and embeddable only on the portal, like the session videos.
        Members see each recording for 90 days. After that they can't, and it's flagged below so you can delete it on Vimeo.
      </p>
      <RecordingForm />
      <ul className="mt-5 space-y-2">
        {(recordings ?? []).map((r) => (
          <li key={r.id} className="psy-card flex items-center justify-between gap-3 p-4 text-sm">
            <span>
              {r.clinic_date} · Vimeo {r.vimeo_id}
              {r.title ? ` · ${r.title}` : ""}
              {r.clinic_date <= cutoff ? " · past 90 days: delete on Vimeo" : ""}
            </span>
            <form action={removeRecording}>
              <input type="hidden" name="id" value={r.id} />
              <button className="text-xs font-semibold text-[#f0a99f]">Remove</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
