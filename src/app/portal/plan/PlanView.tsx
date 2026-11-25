"use client";

import { useEffect, useState } from "react";

export type PlanSession = { number: number; title: string; sheet?: string; open: boolean; key: string };
type Part = { title: string; answers: string[] };

// Reads each open session's Working Sheet (same site, signed in), takes the
// section headings and field ids, and fills them from what the sheet saved in
// this browser. No new storage; if storage is blocked, it simply shows empty.
async function partsFor(s: PlanSession): Promise<Part[]> {
  if (!s.sheet) return [];
  let saved: Record<string, string | boolean> = {};
  try {
    saved = JSON.parse(window.localStorage.getItem(s.key) || "{}");
  } catch {
    return [];
  }
  if (Object.keys(saved).length === 0) return [];
  const html = await fetch(s.sheet).then((r) => (r.ok ? r.text() : ""));
  const doc = new DOMParser().parseFromString(html, "text/html");
  const parts: Part[] = [];
  doc.querySelectorAll("section").forEach((sec, i) => {
    const head = sec.querySelector("h2, h3");
    const title = (head?.textContent || `Part ${i + 1}`).replace(/\s+/g, " ").trim().replace(/^\d+\s*/, "");
    const answers: string[] = [];
    sec.querySelectorAll("input, textarea").forEach((el) => {
      const v = el.id ? saved[el.id] : undefined;
      if (typeof v === "string" && v.trim()) answers.push(v.trim());
    });
    if (answers.length) parts.push({ title, answers });
  });
  return parts;
}

export function PlanView({ sessions, free }: { sessions: PlanSession[]; free: boolean }) {
  const [plan, setPlan] = useState<Record<number, Part[]>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    Promise.all(sessions.filter((s) => s.open).map(async (s) => [s.number, await partsFor(s)] as const))
      .then((rows) => live && setPlan(Object.fromEntries(rows)))
      .catch(() => {})
      .finally(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, [sessions]);

  return (
    <div className="grid gap-4">
      {sessions.map((s) => {
        const parts = plan[s.number] ?? [];
        return (
          <section
            key={s.number}
            className={`rounded-[18px] border p-5 sm:p-6 ${s.open ? "border-line bg-panel" : "border-dashed border-line bg-panel/40 opacity-60"}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-disp text-[18px] font-semibold text-off">
                Chapter {s.number}: {s.title}
              </h2>
              {!s.open ? (
                <span className="text-[12.5px] text-mut">{free ? "🔒 Opens in Build™" : "🔒 Not open yet"}</span>
              ) : parts.length > 0 ? (
                <span className="text-[12.5px] font-semibold text-[#9be7b0]">✓ Built by you</span>
              ) : null}
            </div>
            {s.open && ready && parts.length === 0 && (
              <p className="mt-2 text-[14px] text-sec">
                Nothing here yet.{" "}
                {s.sheet && (
                  <a href={s.sheet} target="_blank" rel="noopener noreferrer" className="font-semibold text-orange underline">
                    Fill in the Working Sheet
                  </a>
                )}{" "}
                and your answers appear here.
              </p>
            )}
            {parts.map((p) => (
              <div key={p.title} className="mt-4">
                <div className="font-disp text-[12px] font-semibold uppercase tracking-[1.2px] text-orange">{p.title}</div>
                <ul className="mt-1.5 grid gap-1 text-[14.5px] leading-relaxed text-off">
                  {p.answers.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            ))}
            {!s.open && free && s.number === 2 && (
              <a href="/build" target="_blank" rel="noopener" className="psy-btn mt-4 inline-block">
                See what&rsquo;s in Build™
              </a>
            )}
          </section>
        );
      })}
      <p className="text-[12.5px] text-mut">Your answers are saved on this device, where you typed them.</p>
    </div>
  );
}
