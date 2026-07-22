import type { FileRow, Week } from "@/lib/types";
import { pad, stripWeekPrefix } from "@/lib/week";
import { weekVideo } from "@/lib/videos";
import { weekWorkbook, weekResources } from "@/lib/resources";
import { VimeoEmbed } from "./VimeoEmbed";

// Earlier, finished weeks collapse into compact rows. "Reopen" expands a row to
// reveal that week's materials again — nothing is lost, it's just tucked away.
export function CompletedWeeks({
  weeks,
  filesFor,
}: {
  weeks: Week[];
  filesFor: (weekId: string) => FileRow[];
}) {
  return (
    <section className="psy-card px-6 py-2">
      {weeks.map((w, i) => (
        <details key={w.id} className={`group ${i > 0 ? "border-t border-line" : ""}`}>
          <summary className="flex cursor-pointer list-none items-center gap-3.5 py-3.5">
            <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full border border-orange/40 bg-orange/[0.14] text-[12px] font-bold text-orange">
              ✓
            </span>
            <span className="min-w-0">
              <span className="block font-disp text-[14.5px] font-semibold">
                Week {pad(w.number)} — {stripWeekPrefix(w.title)}
              </span>
              {w.description && (
                <span className="block truncate text-[12.5px] text-sec">{w.description}</span>
              )}
            </span>
            <span className="ml-auto whitespace-nowrap font-disp text-[12.5px] font-semibold text-orange">
              Reopen{" "}
              <span className="inline-block transition group-open:rotate-90">›</span>
            </span>
          </summary>
          <div className="pb-5 sm:pl-[40px]">
            <WeekMaterials week={w} files={filesFor(w.id)} />
          </div>
        </details>
      ))}
    </section>
  );
}

function WeekMaterials({ week, files }: { week: Week; files: FileRow[] }) {
  const video = weekVideo(week.number);
  const workbook = weekWorkbook(week.number);
  const resources = weekResources(week.number);
  const wsFiles = files.filter((f) => f.kind === "worksheet");
  const resFiles = files.filter((f) => f.kind === "resource");

  return (
    <div className="grid gap-3">
      {video && (
        <div className="max-w-[520px]">
          <VimeoEmbed video={video} title={week.title} />
        </div>
      )}
      <div className="flex flex-wrap gap-2.5">
        {workbook && (
          <Chip href={workbook.href} label={workbook.label} open={workbook.open} accent />
        )}
        {wsFiles.map((f) => (
          <Chip key={f.id} href={`/api/download/${f.id}`} label={f.title} accent />
        ))}
        {resources.map((r) => (
          <Chip key={r.href} href={r.href} label={r.label} open={r.open} />
        ))}
        {resFiles.map((f) => (
          <Chip key={f.id} href={`/api/download/${f.id}`} label={f.title} />
        ))}
      </div>
    </div>
  );
}

function Chip({
  href,
  label,
  open,
  accent,
}: {
  href: string;
  label: string;
  open?: boolean;
  accent?: boolean;
}) {
  return (
    <a
      href={href}
      target={open ? "_blank" : undefined}
      rel={open ? "noopener noreferrer" : undefined}
      className={`inline-flex items-center gap-2 rounded-[10px] border px-3.5 py-2 text-[13px] text-off transition hover:border-orange ${
        accent ? "border-orange/40 bg-orange/[0.14]" : "border-line bg-[#0c1424]"
      }`}
    >
      <span className="text-orange">{open ? "↗" : "⤓"}</span>
      {label}
    </a>
  );
}
