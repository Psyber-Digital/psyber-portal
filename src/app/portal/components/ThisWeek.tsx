import type { ReactNode } from "react";
import type { FileRow, Week } from "@/lib/types";
import { weekVideo } from "@/lib/videos";
import { weekWorkbook, weekResources, weekPrintResources, type PortalResource } from "@/lib/resources";
import { weekGuide, type WeekGuide } from "@/lib/weekGuide";
import { VimeoEmbed } from "./VimeoEmbed";

// The current week's full treatment: the coach's framing note + time budget,
// then up to three numbered steps — watch (video), complete (workbook hero),
// keep to hand (resources). Each step only renders if that material exists.
export function ThisWeek({ week, files }: { week: Week; files: FileRow[] }) {
  const guide = weekGuide(week.number);
  const video = weekVideo(week.number);
  const workbook = weekWorkbook(week.number);
  const resources = weekResources(week.number);
  const printResources = weekPrintResources(week.number);
  // Static config is authoritative: if a week defines its workbook/resources here,
  // we don't also pull DB files of that kind (avoids the same material showing twice
  // under two names). Weeks without static config fall back to admin-uploaded files.
  const wsFiles = workbook
    ? []
    : files.filter((f) => f.kind === "worksheet").sort((a, b) => a.sort_order - b.sort_order);
  const resFiles =
    resources.length > 0
      ? []
      : files.filter((f) => f.kind === "resource").sort((a, b) => a.sort_order - b.sort_order);

  const hasWorkbook = Boolean(workbook) || wsFiles.length > 0;
  const hasResources = resources.length > 0 || resFiles.length > 0 || printResources.length > 0;
  const hasAny = Boolean(video) || hasWorkbook || hasResources;

  let step = 0;

  return (
    <>
      {guide?.note && <FramingNote note={guide.note} budget={guide.budget} />}

      <div className="grid gap-4">
        {video && (
          <StepVideo n={(step += 1)} guide={guide} video={video} title={week.title} />
        )}
        {hasWorkbook && (
          <StepWorkbook n={(step += 1)} guide={guide} workbook={workbook} wsFiles={wsFiles} />
        )}
        {hasResources && (
          <StepResources
            n={(step += 1)}
            guide={guide}
            resources={resources}
            resFiles={resFiles}
            printResources={printResources}
          />
        )}
        {!hasAny && (
          <div className="psy-card p-8 text-center text-sm text-mut">
            Materials for this week are being prepared.
          </div>
        )}
      </div>
    </>
  );
}

/* ---------------- framing note ---------------- */

function FramingNote({
  note,
  budget,
}: {
  note: NonNullable<WeekGuide["note"]>;
  budget?: WeekGuide["budget"];
}) {
  return (
    <section className="psy-card mb-[18px] flex items-start gap-[18px] border-l-[3px] border-l-orange p-6">
      <div
        className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[linear-gradient(135deg,#FF8D1E,#ffb15e)] text-[#241100]"
        aria-hidden="true"
      >
        <CompassIcon />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-disp text-[11px] font-semibold uppercase tracking-[1.5px] text-orange">
          {note.fromLabel}
        </div>
        <p className="mt-2 max-w-[70ch] text-[14.5px] leading-relaxed text-off">{note.body}</p>
        {budget && (
          <div className="mt-3.5 inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-orange/40 bg-orange/[0.14] px-3.5 py-2.5 font-disp text-[13px] font-semibold text-off">
            <span>
              ⏱ About <b className="text-orange">{budget.total}</b> this week
            </span>
            {budget.parts.map((p) => (
              <span key={p.label} className="inline-flex items-center gap-x-4">
                <span className="font-normal text-mut">·</span>
                <span>
                  <b className="text-orange">{p.value}</b> {p.label}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// A compass — guidance from your coach. Sits in the note's orange disc in place
// of an initial, symbolising direction/advice rather than a person's name.
function CompassIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.25" />
      <polygon points="15.9 8.1 13.8 13.8 8.1 15.9 10.2 10.2" fill="currentColor" stroke="none" />
      <polygon points="15.9 8.1 13.8 13.8 8.1 15.9 10.2 10.2" />
    </svg>
  );
}

/* ---------------- step scaffolding ---------------- */

function StepNum({ n, hero }: { n: number; hero?: boolean }) {
  return (
    <div
      className={`grid h-[38px] w-[38px] flex-none place-items-center rounded-full font-disp text-[15px] font-bold ${
        hero
          ? "border border-orange bg-orange text-[#241100]"
          : "border border-orange/40 bg-orange/[0.14] text-orange"
      }`}
    >
      {n}
    </div>
  );
}

function Kicker({ label, mins }: { label: string; mins?: string }) {
  return (
    <div className="flex items-center gap-2 font-disp text-[11px] font-semibold uppercase tracking-[1.5px] text-orange">
      {label}
      {mins && <span className="font-medium tracking-[1px] text-mut">· {mins}</span>}
    </div>
  );
}

function StepTitle({ children }: { children: ReactNode }) {
  return <h3 className="mt-1.5 font-disp text-[18px] font-semibold">{children}</h3>;
}

function StepP({ children }: { children: ReactNode }) {
  return <p className="mt-2 max-w-[64ch] text-[14px] leading-relaxed text-sec">{children}</p>;
}

// Standing guidance shown on every worksheet: how to do the work, not what.
// The flow-state / deep-work method — do it in focused sittings (one or several);
// if stuck, skim, jot, walk, and return. (Codex: METHOD-flow-first-worksheets.)
function FlowNote() {
  return (
    <div className="mt-3.5 max-w-[70ch] rounded-[10px] border border-line bg-[#0c1424] p-3.5">
      <div className="font-disp text-[11px] font-semibold uppercase tracking-[1.5px] text-orange">
        Do it in flow
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-sec">
        Work through this in <strong className="text-off">focused sittings</strong> —
        distractions off, a single task, no multitasking. One sitting or several is fine; what
        matters is that each one is properly focused. The longer you hold that focus, the more
        the work gives back.
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-sec">
        Stuck? Don&rsquo;t force it. Skim the page, jot whatever comes to mind — rough, unpressured —
        then step away for a short walk. Come back and drop into focus again.
      </p>
    </div>
  );
}

/* ---------------- step 1 · video ---------------- */

function StepVideo({
  n,
  guide,
  video,
  title,
}: {
  n: number;
  guide?: WeekGuide;
  video: NonNullable<ReturnType<typeof weekVideo>>;
  title: string;
}) {
  const s = guide?.videoStep;
  return (
    <section className="psy-card overflow-hidden">
      <div className="flex items-start gap-5 p-6">
        <StepNum n={n} />
        <div className="min-w-0 flex-1">
          <Kicker label="Watch first" mins={s?.mins ?? "video"} />
          <StepTitle>{s?.title ?? "Pre-work video"}</StepTitle>
          {s?.blurb && <StepP>{s.blurb}</StepP>}
          <div className="mt-4">
            <VimeoEmbed video={video} title={title} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- step 2 · workbook (hero) ---------------- */

function StepWorkbook({
  n,
  guide,
  workbook,
  wsFiles,
}: {
  n: number;
  guide?: WeekGuide;
  workbook?: PortalResource;
  wsFiles: FileRow[];
}) {
  const s = guide?.workbookStep;
  return (
    <section
      className="psy-card relative overflow-hidden border-orange/40"
      style={{ backgroundImage: "linear-gradient(125deg,#2a1c0b 0%,#171d31 52%,#0f1728 100%)" }}
    >
      <span className="absolute left-0 top-0 block h-0.5 w-full bg-[linear-gradient(90deg,transparent,#FF8D1E,transparent)] opacity-80" />
      <div className="flex flex-col items-stretch gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-5">
          <StepNum n={n} hero />
          <div className="min-w-0 flex-1">
            <Kicker label="Then complete" mins={s?.mins ?? "workbook"} />
            <StepTitle>{s?.title ?? "Your workbook"}</StepTitle>
            {s?.blurb && <StepP>{s.blurb}</StepP>}
            <span className="mt-3 inline-block rounded-lg border border-orange/40 bg-orange/[0.14] px-3 py-1.5 font-disp text-[12px] font-semibold text-orange">
              ✎ Bring it rough — question marks welcome
            </span>
            <FlowNote />
            {s?.caveat && (
              <p className="mt-3.5 max-w-[70ch] border-t border-dashed border-line pt-3 text-[12.5px] leading-relaxed text-sec">
                {s.caveat}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 text-center sm:min-w-[210px]">
          {workbook && (
            <a
              href={workbook.href}
              target={workbook.open ? "_blank" : undefined}
              rel={workbook.open ? "noopener noreferrer" : undefined}
              className="psy-btn-orange group"
            >
              {workbook.label} <span className="transition group-hover:translate-x-1">→</span>
            </a>
          )}
          {wsFiles.map((f) => (
            <a key={f.id} href={`/api/download/${f.id}`} className="psy-btn-orange">
              {f.title}
            </a>
          ))}
          <span className="text-[11.5px] text-mut">
            Opens in a new tab · download a PDF copy when done
          </span>
        </div>
      </div>
    </section>
  );
}

/* ---------------- step 3 · resources ---------------- */

function StepResources({
  n,
  guide,
  resources,
  resFiles,
  printResources,
}: {
  n: number;
  guide?: WeekGuide;
  resources: PortalResource[];
  resFiles: FileRow[];
  printResources: PortalResource[];
}) {
  const s = guide?.resourcesStep;
  return (
    <section className="psy-card overflow-hidden">
      <div className="flex items-start gap-5 p-6">
        <StepNum n={n} />
        <div className="min-w-0 flex-1">
          <Kicker label="Keep to hand" mins="reference" />
          <StepTitle>Additional resources</StepTitle>
          {s?.blurb && <StepP>{s.blurb}</StepP>}
          <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
            {resources.map((r) => (
              <ResourceCard
                key={r.href}
                href={r.href}
                icon={r.icon}
                title={r.label}
                sub={r.sub}
                open={r.open}
              />
            ))}
            {resFiles.map((f) => (
              <ResourceCard key={f.id} href={`/api/download/${f.id}`} icon="▤" title={f.title} sub="PDF" />
            ))}
          </div>

          {printResources.length > 0 && (
            <div className="mt-5 border-t border-dashed border-line pt-4">
              <div className="flex items-center gap-2 font-disp text-[11px] font-semibold uppercase tracking-[1.5px] text-mut">
                <span aria-hidden="true">⎙</span> Print-ready versions
              </div>
              <p className="mt-1 max-w-[64ch] text-[12.5px] leading-relaxed text-mut">
                The same resources in black and white, ready to print.
              </p>
              <div className="mt-3 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
                {printResources.map((r) => (
                  <ResourceCard
                    key={r.href}
                    href={r.href}
                    icon={r.icon}
                    title={r.label}
                    sub={r.sub}
                    open={r.open}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ResourceCard({
  href,
  icon,
  title,
  sub,
  open,
}: {
  href: string;
  icon?: string;
  title: string;
  sub?: string;
  open?: boolean;
}) {
  return (
    <a
      href={href}
      target={open ? "_blank" : undefined}
      rel={open ? "noopener noreferrer" : undefined}
      className="flex items-center gap-3 rounded-xl border border-line bg-[#0c1424] p-3.5 text-off transition hover:-translate-y-px hover:border-orange"
    >
      <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[9px] bg-orange/[0.14] text-[17px] text-orange">
        {icon ?? "▤"}
      </span>
      <span className="min-w-0">
        <span className="block font-disp text-[14px] font-semibold leading-tight">{title}</span>
        {sub && <span className="mt-0.5 block text-[12px] text-mut">{sub}</span>}
      </span>
    </a>
  );
}
