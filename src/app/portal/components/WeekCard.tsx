import type { FileRow, Week } from "@/lib/types";

const pad = (n: number) => String(n).padStart(2, "0");

function FileChip({ file, primary }: { file: FileRow; primary?: boolean }) {
  return (
    <a
      href={`/api/download/${file.id}`}
      className={`inline-flex items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-[13.5px] text-off transition hover:border-blue ${
        primary ? "border-blue/40 bg-blue/[0.14]" : "border-line bg-[#0a111f]"
      }`}
    >
      <span className="text-[15px] text-blue">⤓</span>
      {file.title}
    </a>
  );
}

function Block({
  label,
  files,
  primary,
  emptyText,
}: {
  label: string;
  files: FileRow[];
  primary?: boolean;
  emptyText: string;
}) {
  return (
    <div className="mt-[18px]">
      <div className="mb-2.5 flex items-center gap-2 font-disp text-[11px] font-medium uppercase tracking-[2px] text-slate">
        {label}
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="flex flex-wrap gap-2.5">
        {files.length ? (
          files.map((f) => <FileChip key={f.id} file={f} primary={primary} />)
        ) : (
          <span className="text-[13.5px] italic text-dim">{emptyText}</span>
        )}
      </div>
    </div>
  );
}

export function WeekCard({ week, files }: { week: Week; files: FileRow[] }) {
  const worksheets = files
    .filter((f) => f.kind === "worksheet")
    .sort((a, b) => a.sort_order - b.sort_order);
  const resources = files
    .filter((f) => f.kind === "resource")
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="psy-card p-6">
      <span className="psy-eyebrow text-blue">Week {pad(week.number)} · Therapy+</span>
      <h3 className="mt-1.5 font-disp text-[17px] font-semibold">{week.title}</h3>
      {week.description && (
        <p className="mt-2 max-w-[64ch] text-[13.5px] text-slate">
          {week.description}
        </p>
      )}
      <Block
        label="Worksheet"
        files={worksheets}
        primary
        emptyText="Worksheet coming soon"
      />
      <Block
        label="Useful Resources"
        files={resources}
        emptyText="No additional resources this week"
      />
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
