"use client";

import { useEffect, useState } from "react";

// The launch-ladder countdown (Don, 21 Nov 2026): the yearly saving open now
// and when it drops. The deadline comes from the server; this only ticks.
export function Countdown({
  endsAt,
  off,
  nextOff,
  yearly,
  onSale,
  link = true,
  slim = false,
}: {
  endsAt: string;
  off: number;
  nextOff?: number;
  yearly: number;
  onSale: boolean;
  // Off on the upgrade page itself, where a link back to it is pointless.
  link?: boolean;
  /** One line at the top of Today, so help comes before the price (Don, card CD = A, 25 Nov 2026). */
  slim?: boolean;
}) {
  const [left, setLeft] = useState(() => new Date(endsAt).getTime() - Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setLeft(new Date(endsAt).getTime() - Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [endsAt]);
  if (left <= 0) return null;
  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const parts: [number, string][] = [[d, "days"], [h, "hours"], [m, "mins"], [s, "secs"]];
  if (slim) {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[12px] border border-[#ffb36b] bg-[linear-gradient(135deg,#FFA54A,#E8780F)] px-4 py-2 text-[13.5px] text-[#1a0d00]">
        <b className="font-disp font-semibold">🔥 ${off} off your first year of Build™</b>
        <span className="font-disp tabular-nums">
          {d}d {h}h {String(m).padStart(2, "0")}m {String(s).padStart(2, "0")}s left
        </span>
        <span className="text-[12.5px]">{nextOff ? `Then $${nextOff} off.` : "Then full price."}</span>
        {link && onSale && (
          <a href="/portal/billing" className="ml-auto font-semibold underline">See Build™ →</a>
        )}
      </div>
    );
  }
  return (
    <div className="mb-6 overflow-hidden rounded-[18px] border border-[#ffb36b] bg-[linear-gradient(135deg,#FFA54A,#E8780F)] p-5 text-[#1a0d00]">
      <p className="font-disp text-[11px] font-semibold uppercase tracking-[1.6px]">{onSale ? "Your launch saving is live!" : "Your launch saving"}</p>
      <p className="mt-1 font-disp text-[20px] font-semibold leading-snug sm:text-[22px]">
        ${off} off your first year of Build™: ${yearly - off} instead of ${yearly}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:max-w-[360px]">
        {parts.map(([n, label]) => (
          <div key={label} className="rounded-xl bg-[#0B1220] px-2 py-2 text-center text-white">
            <b className="block font-disp text-[20px] leading-none">{n}</b>
            <span className="text-[11px] text-sec">{label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[13.5px]">
        {nextOff ? `Then the saving drops to $${nextOff}.` : "Then it's the full price."}{" "}
        {!link ? null : onSale ? (
          <a href="/portal/billing" className="font-semibold underline">See Build™ →</a>
        ) : (
          "Build™ opens soon."
        )}
      </p>
    </div>
  );
}
