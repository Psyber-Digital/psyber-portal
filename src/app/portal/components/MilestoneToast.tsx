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
    burstAt(window.innerWidth / 2, window.innerHeight - 90);
    const t = window.setTimeout(() => setBadge(null), 4200);
    return () => window.clearTimeout(t);
  }, [earned, memberKey]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#3b5a92] bg-[#0f1a2e] py-3 pl-3 pr-5 shadow-card transition-all duration-500 ${
        badge ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"
      }`}
    >
      {badge && (
        <>
          <span
            className={`grid h-11 w-11 flex-none place-items-center rounded-full ${badge.tone === "blue" ? "psy-medal-blue" : "psy-medal-orange"}`}
          >
            <BadgeGlyph
              icon={badge.icon}
              className={`h-5 w-5 ${badge.tone === "blue" ? "stroke-[#04122a]" : "stroke-[#2a1400]"}`}
            />
          </span>
          <span>
            <span className="block font-disp text-[11px] font-semibold uppercase tracking-[1.4px] text-orange">
              Milestone earned
            </span>
            <span className="block font-disp text-[15px] font-semibold text-off">{badge.name}</span>
          </span>
        </>
      )}
    </div>
  );
}
