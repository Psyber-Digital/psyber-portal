"use client";

import { useState } from "react";

// "When will you do it?" (Don, card AD, 25 Nov 2026). Naming a time and place
// makes people much more likely to follow through (implementation intentions,
// Gollwitzer & Sheeran 2006). The member picks a time; the portal hands their
// own calendar an event. Nothing is stored or sent by us.

function pad(n: number) {
  return String(n).padStart(2, "0");
}
// Local time as a floating calendar time (YYYYMMDDTHHMMSS), so it lands at
// the hour they picked, in their own time zone.
function stamp(d: Date) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}
function defaultTime() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(19, 0, 0, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T19:00`;
}

export function ScheduleMove({ title, mins, url }: { title: string; mins?: string; url: string }) {
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState(defaultTime);
  const minutes = Math.min(Math.max(parseInt(mins ?? "", 10) || 30, 10), 120);
  const start = new Date(when);
  const end = new Date(start.getTime() + minutes * 60000);
  const name = `Next move: ${title}`;
  const details = `Your next move in Build™. Open it here: ${url}`;
  const google =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(name)}&dates=${stamp(start)}/${stamp(end)}&details=${encodeURIComponent(details)}`;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Psyber Digital//Build//EN", "BEGIN:VEVENT",
    `UID:${stamp(start)}-${Math.random().toString(36).slice(2)}@psyberdigital.com`,
    `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${name.replace(/[,;]/g, " ")}`, `DESCRIPTION:${details.replace(/[,;]/g, " ")}`,
    "BEGIN:VALARM", "TRIGGER:-PT10M", "ACTION:DISPLAY", "DESCRIPTION:Your next move", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const icsHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  const valid = !Number.isNaN(start.getTime());

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 text-[13.5px] font-semibold underline decoration-dotted underline-offset-2">
        📅 Lock in a time for this move
      </button>
    );
  }
  return (
    <div className="mt-3 rounded-xl bg-[#0B1220]/85 p-4 text-[14px] text-off">
      <b className="font-disp font-semibold">When will you do this move?</b>
      <p className="mt-1 text-[13px] text-sec">Pick a time, and it goes in your calendar. A set time makes it much more likely to happen!</p>
      <input
        type="datetime-local"
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        className="mt-3 w-full rounded-lg border border-line bg-panel px-3 py-2 text-off sm:w-auto"
      />
      {valid && (
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={google} target="_blank" rel="noopener noreferrer" className="psy-btn !px-4 !py-2 !text-[13.5px]">Google Calendar</a>
          <a href={icsHref} download="next-move.ics" className="psy-btn-ghost !px-4 !py-2 !text-[13.5px]">Apple or Outlook</a>
        </div>
      )}
    </div>
  );
}
