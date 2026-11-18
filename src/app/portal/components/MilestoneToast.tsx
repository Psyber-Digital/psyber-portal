"use client";

import { useEffect, useState } from "react";
import type { Badge } from "@/lib/milestones";
import { BadgeGlyph } from "./MilestoneGlyph";
import { burstAt } from "./burst";

// Shows "Milestone earned" once, the first time this browser sees a badge.
// The memory is a per-viewer convenience in browser storage. If storage is
// blocked, nothing shows, which is safe. The very first visit only records
// what is already earned, so nobody gets a burst of old badges at once.
export function MilestoneToast({ earned, memberKey }: { earned: Badge[]; memberKey: string }) {
  const [badge, setBadge] = useState<Badge | null>(null);

  useEffect(() => {
    const key = `psy-milestones-${memberKey}`;
    let seen: string[] | null = null;
    try {
      const raw = window.localStorage.getItem(key);
      seen = raw ? (JSON.parse(raw) as string[]) : null;
    } catch {
      return;
    }
    const fresh = seen ? earned.filter((b) => !seen!.includes(b.key)) : [];
    try {
      window.localStorage.setItem(key, JSON.stringify(earned.map((b) => b.key)));
    } catch {
      /* storage blocked: skip the memory */
    }
    if (fresh.length === 0) return;
    setBadge(fresh[fresh.length - 1]);
    burstAt(window.innerWidth / 2, window.innerHeight / 2);
    const t = window.setTimeout(() => setBadge(null), 6000);
    return () => window.clearTimeout(t);
  }, [earned, memberKey]);

  if (!badge) return <span role="status" aria-live="polite" className="sr-only" />;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 grid place-items-center bg-[#050a14]/70 p-6 backdrop-blur-sm"
      onClick={() => setBadge(null)}
    >
      <div className="psy-deck-card w-full max-w-[340px] rounded-[22px] border border-[#3b5a92] bg-[linear-gradient(160deg,#1a2744,#121B2E)] px-6 py-8 text-center shadow-card">
        <span
          className={`psy-medal-shine relative mx-auto grid h-24 w-24 place-items-center rounded-full ${badge.tone === "blue" ? "psy-medal-blue" : "psy-medal-orange"}`}
        >
          <BadgeGlyph
            icon={badge.icon}
            className={`h-10 w-10 ${badge.tone === "blue" ? "stroke-[#04122a]" : "stroke-[#2a1400]"}`}
          />
        </span>
        <span className="mt-5 block font-disp text-[12px] font-semibold uppercase tracking-[1.6px] text-orange">
          Milestone earned
        </span>
        <span className="mt-1 block font-disp text-[22px] font-semibold text-off">{badge.name}</span>
        <button type="button" className="psy-btn mt-6 w-full" onClick={() => setBadge(null)}>
          Keep going
        </button>
      </div>
    </div>
  );
}
