// The one lane question before Session 3 opens (Don, War Room m08 = A,
// 18 Nov 2026). Build members confirm their own niche; this is the only check
// beyond their own lane test in Session 2, so the browser requires the tick
// and finishSession refuses Session 2 without it.
export function NicheLaneCheck() {
  return (
    <div className="mt-3 max-w-[64ch]">
      <label className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-sec">
        <input type="checkbox" name="lane_ok" value="yes" required className="mt-1 h-4 w-4 flex-none accent-blue" />
        <span>
          My niche moves people from well to better. It doesn&rsquo;t diagnose or treat a condition, or stand in for therapy.
        </span>
      </label>
      <p className="mt-2 text-xs leading-relaxed text-slate">
        Not sure? Bring it to the weekly drop-in before you go on.
      </p>
    </div>
  );
}
