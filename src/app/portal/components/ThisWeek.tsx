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
    <section className="psy-card mb-[18px] flex items-start gap-4 border-l-[3px] border-l-orange p-5 sm:gap-[18px] sm:p-6">
      {/* The note carried four accent treatments at once — a filled orange disc, an
          orange left border, an orange eyebrow and an orange figure — and sat second
          on the page, so it competed with the step it was introducing. The left
          border is kept: it is the coach's signature down the side, and one mark is
          enough to say whose voice this is. The disc drops to an outline. */}
      <div
        className="grid h-11 w-11 flex-none place-items-center rounded-full border border-orange/40 bg-orange/[0.10] text-orange"
        aria-hidden="true"
      >
        <CompassIcon />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-disp text-[11px] font-semibold uppercase tracking-[1.5px] text-mut">
          {note.fromLabel}
        </div>
        <p className="mt-2 max-w-[70ch] text-[14.5px] leading-relaxed text-off">{note.body}</p>
        {/* One number, not four. The strip used to show the total and every part at
            once — "60 minutes · 5 min to watch · 15 min for the sheet · 40 min on
            your list" — which is four figures to reconcile before you know whether
            you have time this week. The total answers that; the breakdown is a
            click away for anyone planning their week around it. */}
        {budget && (
          <details className="group mt-3.5 max-w-[70ch]">
            <summary className="inline-flex cursor-pointer list-none flex-wrap items-baseline gap-x-2.5 font-disp text-[13.5px] font-semibold text-off marker:hidden">
              <span>
                ⏱ About <b className="text-orange">{budget.total}</b> this week
              </span>
              <span className="text-[11.5px] font-normal text-mut underline decoration-dotted underline-offset-2">
                <span className="group-open:hidden">what that&rsquo;s made of</span>
                <span className="hidden group-open:inline">hide</span>
              </span>
            </summary>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] leading-relaxed text-mut">
              {budget.parts.map((p) => (
                <span key={p.label}>
                  <b className="font-semibold text-sec">{p.value}</b> {p.label}
                </span>
              ))}
            </div>
          </details>
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

// Step numbers are wayfinding, not emphasis. They were accented — filled orange for
// the workbook, tinted orange for the others — which put three more accent marks on
// a page that already had thirty-one. Testers called the portal overwhelming, and
// this is a large part of why: when everything is accented, nothing leads.
//
// The accent is now spent in one place per week: the button that opens the sheet.
function StepNum({ n }: { n: number; hero?: boolean }) {
  return (
    <div className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full border border-line bg-[#0c1424] font-disp text-[15px] font-semibold text-mut">
      {n}
    </div>
  );
}

function Kicker({ label, mins }: { label: string; mins?: string }) {
  return (
    <div className="flex items-center gap-2 font-disp text-[11px] font-semibold uppercase tracking-[1.5px] text-mut">
      {label}
      {mins && <span className="font-medium tracking-[1px] text-mut/70">· {mins}</span>}
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
//
// Folded behind a disclosure. It is standing guidance — the same words every week —
// and it was sitting open inside the step, two paragraphs deep, between the client
// and the button they came to press. Kept in full for whoever wants it, closed for
// whoever already knows.
function FlowNote() {
  return (
    <details className="group mt-3.5 max-w-[70ch] rounded-[10px] border border-line bg-[#0c1424] p-3.5">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-disp text-[11px] font-semibold uppercase tracking-[1.5px] text-mut marker:hidden">
        Do it in flow
        <span className="text-[10px] font-normal tracking-normal text-mut/70 group-open:hidden">
          — how to work through it
        </span>
      </summary>
      <p className="mt-2 text-[13px] leading-relaxed text-sec">
        Work through this in <strong className="text-off">focused sittings</strong> —
        distractions off, a single task, no multitasking. One sitting or several is fine; what
        matters is that each one is properly focused. The longer you hold that focus, the more
        the work gives back.
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-sec">
        Stuck? Don&rsquo;t force it. Skim the page, jot whatever comes to mind — rough, unpressured —
        then step away for a short walk. Come back and drop into focus again.
      </p>
    </details>
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
  // The video sits full card-width below the step header (not inset behind the
  // step number) so it's as large as possible — most impactful on a phone.
  return (
    <section className="psy-card overflow-hidden p-5 sm:p-6">
      <div className="flex items-start gap-4 sm:gap-5">
        <StepNum n={n} />
        <div className="min-w-0 flex-1">
          <Kicker label="Watch first" mins={s?.mins ?? "video"} />
          <StepTitle>{s?.title ?? "Pre-work video"}</StepTitle>
          {s?.blurb && <StepP>{s.blurb}</StepP>}
        </div>
      </div>
      <div className="mt-4">
        <VimeoEmbed video={video} title={title} />
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
    // The card carried an orange border, an orange top-edge gradient and a warm
    // gradient background, on top of a filled orange step number and an orange chip
    // — five accent treatments competing inside one card. The button is the thing
    // to press, so the button is what stays coloured.
    <section className="psy-card relative overflow-hidden">
      <div className="flex flex-col items-stretch gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
          <StepNum n={n} />
          <div className="min-w-0 flex-1">
            <Kicker label="Then complete" mins={s?.mins ?? "workbook"} />
            <StepTitle>{s?.title ?? "Your workbook"}</StepTitle>
            {s?.blurb && <StepP>{s.blurb}</StepP>}
            <span className="mt-3 inline-block rounded-lg border border-line bg-[#0c1424] px-3 py-1.5 font-disp text-[12px] font-medium text-sec">
              ✎ A loose first pass — question marks welcome
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
      <div className="flex items-start gap-4 p-5 sm:gap-5 sm:p-6">
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

          {/* The print versions used to repeat every resource as a second full card
              under its own heading — so "The Principle Card" appeared twice on the
              page and read as two things to read. They are the same documents in
              black and white, so they belong as links, not as cards. */}
          {printResources.length > 0 && (
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-dashed border-line pt-3 text-[12px] text-mut">
              <span className="font-disp uppercase tracking-[1.2px]">
                <span aria-hidden="true">⎙</span> Print versions
              </span>
              {printResources.map((r) => (
                <a
                  key={r.href}
                  href={r.href}
                  target={r.open ? "_blank" : undefined}
                  rel={r.open ? "noopener noreferrer" : undefined}
                  className="underline decoration-dotted underline-offset-2 transition hover:text-off"
                >
                  {r.label}
                </a>
              ))}
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
      <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[9px] border border-line bg-[#0c1424] text-[17px] text-mut">
        {icon ?? "▤"}
      </span>
      <span className="min-w-0">
        <span className="block font-disp text-[14px] font-semibold leading-tight">{title}</span>
        {sub && <span className="mt-0.5 block text-[12px] text-mut">{sub}</span>}
      </span>
    </a>
  );
}
