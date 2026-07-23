import type { FileRow, Week } from "@/lib/types";
import { pad, stripWeekPrefix } from "@/lib/week";
import { WeekMaterials } from "./CompletedWeeks";

// A quick "revisit last week" toggle, sitting directly under The Program stepper.
// Native <details> — no client JS. Shows the immediately-previous week's materials
// (video, workbook, resources) so a client can flip back without scrolling to the
// completed-weeks archive lower down.
export function PreviousWeek({ week, files }: { week: Week; files: FileRow[] }) {
  return (
    <details className="psy-card group mb-[26px] px-5 py-1 sm:px-6">
      <summary className="flex cursor-pointer list-none items-center gap-3.5 py-3.5">
        <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full border border-orange/40 bg-orange/[0.14] font-disp text-[12px] font-bold text-orange">
          ‹
        </span>
        <span className="min-w-0">
          <span className="block font-disp text-[11px] font-semibold uppercase tracking-[1px] text-sec">
            Revisit last week
          </span>
          <span className="block font-disp text-[14.5px] font-semibold text-off">
            Week {pad(week.number)} — {stripWeekPrefix(week.title)}
          </span>
        </span>
        <span className="ml-auto whitespace-nowrap font-disp text-[12.5px] font-semibold text-orange">
          Open <span className="inline-block transition group-open:rotate-90">›</span>
        </span>
      </summary>
      <div className="pb-5 pt-1 sm:pl-[40px]">
        <WeekMaterials week={week} files={files} />
      </div>
    </details>
  );
}
