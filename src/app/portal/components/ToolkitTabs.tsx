"use client";

import { useEffect, useState, type ReactNode } from "react";

// The session's toolkit: video, Working Sheet, resources and the coach's note,
// one tab at a time (Don, board r01, 18 Nov 2026). Every panel stays mounted,
// so a playing video isn't lost by switching tabs. The move card's "Watch the
// video" link (#watch) opens the video tab and scrolls to it.
export type ToolkitTab = { id: string; label: string; panel: ReactNode };

export function ToolkitTabs({ tabs }: { tabs: ToolkitTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === id)) {
        setActive(id);
        window.requestAnimationFrame(() =>
          document.getElementById("toolkit")?.scrollIntoView({ behavior: "smooth", block: "start" }),
        );
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  return (
    <>
      <div role="tablist" aria-label="Session toolkit" className="mb-4 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`tk-${t.id}`}
            onClick={() => setActive(t.id)}
            className={`rounded-[10px] border px-3 py-2 font-disp text-[12.5px] font-semibold transition ${
              active === t.id ? "border-blue bg-blue/15 text-off" : "border-line text-mut hover:text-off"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} id={`tk-${t.id}`} role="tabpanel" hidden={active !== t.id}>
          {t.panel}
        </div>
      ))}
    </>
  );
}
