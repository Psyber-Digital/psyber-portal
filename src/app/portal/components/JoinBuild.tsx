import { Brand } from "./Brand";
import { startCheckout } from "../billing/actions";
import { sayYesToBuild } from "../moveActions";
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
  saidYes = false,
}: {
  profile: LadderPerson;
  names: number;
  movesDone: number;
  points: number;
  /** They said "yes, I want my saving" before the sale opened (card PU). */
  saidYes?: boolean;
}) {
  const onSale = buildOnSale();
  const step = currentStep(profile);
  const firstYear = step ? PRICE.yearly - step.off : PRICE.yearly;
  // ATTRACTIVE: the year as a daily amount, true to the cent (card PU).
  const perDay = (firstYear / 365).toFixed(2);
  const waits = savingWaiting(profile);

  return (
    <div className="text-off">
      <p className="text-[14px] leading-relaxed text-sec">
        Look what you&rsquo;ve built! <b className="text-off">{names} {names === 1 ? "name" : "names"}</b>,{" "}
        <b className="text-off">{movesDone} {movesDone === 1 ? "move" : "moves"}</b>, <b className="text-off">{points} points</b>. Every one
        of them comes with you into <Brand name="Build" tm />.
      </p>
      {onSale ? (
        <form action={startCheckout} className="mt-4">
          {saidYes && step && (
            // Consistency: remind them of the yes they already gave (card PU).
            <p className="mb-2 font-disp text-[15px] font-semibold text-orange">You said yes, and here it is: ${step.off} off your first year!</p>
          )}
          <p className="font-disp text-[22px] font-semibold leading-tight">
            ${firstYear}{" "}
            {step && <span className="text-[15px] font-normal text-slate line-through">${PRICE.yearly}</span>}{" "}
            <span className="text-[14px] font-normal text-sec">{step ? `your first year: you save $${step.off}!` : "a year"}</span>
          </p>
          <p className="mt-0.5 text-[13px] text-sec">That&rsquo;s just ${perDay} a day!</p>
          <p className="mt-1 font-disp text-[14.5px] font-semibold text-[#9be7b0]">
            14-day full refund. Change your mind, get every cent back.
          </p>
          <label className="mt-3 flex items-start gap-2.5 text-[13px] leading-relaxed text-sec">
            <input type="checkbox" name="accept_renewal" required className="mt-1" />
            <span>
              I agree my <Brand name="Build" /> membership renews automatically each year until I cancel.{" "}
              <a href="/terms.html" target="_blank" rel="noopener" className="underline">See the full terms</a>
            </span>
          </label>
          <button name="plan" value="yearly" className="psy-btn mt-3 w-full justify-center py-3 sm:w-auto sm:px-8">
            Join <Brand name="Build" tm /> and choose your niche now!
          </button>
          <p className="mt-2 text-[12px] text-slate">
            Then ${PRICE.yearly} a year. Cancel any time from Manage billing.{" "}
            <a href="/portal/billing" className="underline">See everything in Build™</a>
          </p>
        </form>
      ) : (
        <>
          <p className="mt-3 text-[14px] text-off">{waits ? SAVING_WAITS : OPENS_SOON}</p>
          {waits && !saidYes && (
            // EASY + commitment: one tap now, the choice already made when it opens (card PU).
            <form action={sayYesToBuild} className="mt-3">
              <button className="psy-btn">Yes! I want my launch saving</button>
            </form>
          )}
          {waits && saidYes && (
            <p className="mt-3 font-disp text-[15px] font-semibold text-[#9be7b0]">
              ✓ You said yes! Your saving is right here on Today the moment <Brand name="Build" tm /> opens.
            </p>
          )}
          <a href="/portal/billing" className="mt-3 inline-block text-[13.5px] underline">See what&rsquo;s in <Brand name="Build" tm /></a>
        </>
      )}
    </div>
  );
}
