import type { BadgeIcon } from "@/lib/milestones";

// Line icons for the milestone medals. Shared by the server panel and the
// client pop-up, so it holds no hooks and no server-only code.
const PATHS: Record<BadgeIcon, string> = {
  found: "M3 21h18M5 21V10l7-5 7 5v11M10 21v-6h4v6",
  compass: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z",
  quote: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
  mega: "M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1zM17 9a4 4 0 0 1 0 6",
  build: "M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 21h8M12 17v4",
  tag: "M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
  chat: "M7 8h10M7 12h6M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.6A8 8 0 1 1 21 12z",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  people: "M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM2.5 20a6.5 6.5 0 0 1 13 0M17.5 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM16 14.5a5 5 0 0 1 6 5.5",
  steady: "M3 12h4l3-8 4 16 3-8h4",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
};

export function BadgeGlyph({ icon, className }: { icon: BadgeIcon; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[icon]} />
    </svg>
  );
}

