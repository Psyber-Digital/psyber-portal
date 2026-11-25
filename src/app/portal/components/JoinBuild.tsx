import { Brand } from "./Brand";
import { startCheckout } from "../billing/actions";
import { buildOnSale, OPENS_SOON, SAVING_WAITS } from "@/lib/sale";
import { currentStep, PRICE, savingWaiting, type Person as LadderPerson } from "@/lib/ladder";

// Join Build where the pride is (Don, card DD = A, 25 Nov 2026; deep dive,
// 2-habit-conversion #2 and #3). The price, the renewal tick box and the
// button sit right on Today, and the member sees that everything they built
// comes with them. The tick box comes before the button, and the 14-day
// refund is the headline, not the small print (walk-through #6).
export function JoinBuild({
  profile,
  names,
  movesDone,
  points,
}: {
  profile: LadderPerson;
  names: number;
  movesDone: number;
  points: number;
}) {
  const onSale = buildOnSale();
  const step = currentStep(profile);
  const firstYear = step ? PRICE.yearly - step.off : PRICE.yearly;

  return (
    <div className="text-off">
      <p className="text-[14px] leading-relaxed text-sec">
        Everything you&rsquo;ve built comes with you: <b className="text-off">{names} {names === 1 ? "name" : "names"}</b>,{" "}
        <b className="text-off">{movesDone} {movesDone === 1 ? "move" : "moves"}</b> and <b className="text-off">{points} points</b>.
      </p>
      {onSale ? (
        <form action={startCheckout} className="mt-4">
          <p className="font-disp text-[22px] font-semibold leading-tight">
            ${firstYear}{" "}
            {step && <span className="text-[15px] font-normal text-slate line-through">${PRICE.yearly}</span>}{" "}
            <span className="text-[14px] font-normal text-sec">{step ? "your first year" : "a year"}</span>
          </p>
          <p className="mt-1 font-disp text-[14.5px] font-semibold text-[#9be7b0]">
            14-day full refund. Change your mind, get every cent back.
          </p>
          <label className="mt-3 flex items-start gap-2.5 text-[13px] leading-relaxed text-sec">
            <input type="checkbox" name="accept_renewal" required className="mt-1" />
            <span>I agree my <Brand name="Build" /> membership renews automatically each year until I cancel.</span>
          </label>
          <button name="plan" value="yearly" className="psy-btn mt-3 w-full justify-center py-3 sm:w-auto sm:px-8">
            Join <Brand name="Build" tm /> and open stages 2 and 3 now
          </button>
          <p className="mt-2 text-[12px] text-slate">
            Then ${PRICE.yearly} a year. Cancel any time from Manage billing.{" "}
            <a href="/portal/billing" className="underline">See everything in Build™</a>
          </p>
        </form>
      ) : (
        <>
          <p className="mt-3 text-[14px] text-off">{savingWaiting(profile) ? SAVING_WAITS : OPENS_SOON}</p>
          <a href="/portal/billing" className="psy-btn mt-3 inline-block">See what&rsquo;s in <Brand name="Build" tm /></a>
        </>
      )}
    </div>
  );
}
