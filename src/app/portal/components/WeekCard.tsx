import type { ReactNode } from "react";
import type { FileRow, Week } from "@/lib/types";
import { weekVideo } from "@/lib/videos";
import { weekWorkbook, weekResources } from "@/lib/resources";
import { VimeoEmbed } from "./VimeoEmbed";

const pad = (n: number) => String(n).padStart(2, "0");

function LinkChip({
  href,
  label,
  primary,
  open,
}: {
  href: string;
  label: string;
  primary?: boolean;
  open?: boolean;
}) {
  return (
    <a
      href={href}
      target={open ? "_blank" : undefined}
      rel={open ? "noopener noreferrer" : undefined}
      className={`inline-flex items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-[13.5px] text-off transition hover:border-blue ${
        primary ? "border-blue/40 bg-blue/[0.14]" : "border-line bg-[#0a111f]"
      }`}
    >
      <span className="text-[15px] text-blue">{open ? "↗" : "⤓"}</span>
      {label}
    </a>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2 font-disp text-[11px] font-medium uppercase tracking-[2px] text-slate">
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function WeekCard({ week, files }: { week: Week; files: FileRow[] }) {
  const wsFiles = files
    .filter((f) => f.kind === "worksheet")
    .sort((a, b) => a.sort_order - b.sort_order);
  const resFiles = files
    .filter((f) => f.kind === "resource")
    .sort((a, b) => a.sort_order - b.sort_order);
  const video = weekVideo(week.number);
  const workbook = weekWorkbook(week.number);
  const resources = weekResources(week.number);

  const hasWorkbook = Boolean(workbook) || wsFiles.length > 0;
  const hasResources = resources.length > 0 || resFiles.length > 0;

  return (
    <div className="psy-card p-6">
      <span className="psy-eyebrow text-blue">Week {pad(week.number)} · Therapy+</span>
      <h3 className="mt-1.5 font-disp text-[17px] font-semibold">{week.title}</h3>
      {week.description && (
        <p className="mt-2 max-w-[64ch] text-[13.5px] text-slate">{week.description}</p>
      )}

      {video && (
        <div className="mt-[18px]">
          <SectionLabel>Session Video</SectionLabel>
          <VimeoEmbed video={video} title={week.title} />
        </div>
      )}

      <div className="mt-[18px]">
        <SectionLabel>Workbook</SectionLabel>
        <div className="flex flex-wrap gap-2.5">
          {workbook && (
            <LinkChip href={workbook.href} label={workbook.label} open={workbook.open} primary />
          )}
          {wsFiles.map((f) => (
            <LinkChip key={f.id} href={`/api/download/${f.id}`} label={f.title} primary />
          ))}
          {!hasWorkbook && (
            <span className="text-[13.5px] italic text-dim">Workbook coming soon</span>
          )}
        </div>
      </div>

      <div className="mt-[18px]">
        <SectionLabel>Useful Resources</SectionLabel>
        <div className="flex flex-wrap gap-2.5">
          {resources.map((r) => (
            <LinkChip key={r.href} href={r.href} label={r.label} open={r.open} />
          ))}
          {resFiles.map((f) => (
            <LinkChip key={f.id} href={`/api/download/${f.id}`} label={f.title} />
          ))}
          {!hasResources && (
            <span className="text-[13.5px] italic text-dim">
              No additional resources this week
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function LockedCard({ week }: { week: Week }) {
  return (
    <div className="psy-card p-6 opacity-50">
      <span className="psy-eyebrow">Week {pad(week.number)}</span>
      <h3 className="mt-1.5 font-disp text-[17px] font-semibold">{week.title}</h3>
      <div className="mt-3 flex items-center gap-2 text-[13px] text-dim">
        🔒 Unlocks after your session
      </div>
    </div>
  );
}
