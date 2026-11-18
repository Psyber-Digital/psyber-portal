"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The client's top-level navigation. Client-side only because it highlights the
// active section from the current path. Never rendered for the admin — the admin
// dashboard has its own tab strip.
// Structure A (board m10, 18 Nov 2026): "Today" is the move card alone; the
// rest of the program lives in these pages.
const TABS = [
  { href: "/portal", label: "Today" },
  { href: "/portal/program", label: "Program" },
  { href: "/portal/outreach", label: "The List" },
  { href: "/portal/progress", label: "Progress" },
  { href: "/portal/shared", label: "Shared Files" },
];

// The Clinic tab shows for Build members only (Offer Ladder stage 5).
// Self-serve members (Foundations and Build) also see a "One-on-one support"
// button on every page, so moving up is always one tap away (Don, r33, 30 Oct).
export function PortalNav({
  badge,
  clinic,
  oneOnOne,
}: {
  badge?: number;
  clinic?: boolean;
  oneOnOne?: boolean;
}) {
  const pathname = usePathname();
  const tabs = clinic ? [...TABS, { href: "/portal/clinic", label: "Drop-in" }] : TABS;

  return (
    <nav className="-mt-2 mb-7 flex flex-wrap gap-2">
      {tabs.map((t) => {
        // "/portal" must match only itself, or it would light up on every page.
        const active = t.href === "/portal" ? pathname === "/portal" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-[10px] border px-4 py-2.5 font-disp text-[13px] transition ${
              active
                ? "border-orange/50 bg-orange/[0.12] text-orange"
                : "border-line bg-transparent text-mut hover:border-orange/30 hover:text-sec"
            }`}
          >
            {t.label}
            {t.href === "/portal/shared" && !!badge && (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-orange px-1.5 text-[10px] font-bold text-ink">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
      {oneOnOne && (
        // Same shape as the tabs so it sits in the strip naturally; solid blue
        // with a glow so it stands out as the way up (Don, r33, twice).
        <Link
          href="/portal/one-on-one"
          aria-current={pathname.startsWith("/portal/one-on-one") ? "page" : undefined}
          className={`inline-flex items-center gap-1.5 rounded-[10px] border border-blue bg-blue px-4 py-2.5 font-disp text-[13px] font-semibold text-ink shadow-[0_0_18px_rgba(30,144,255,0.35)] transition hover:brightness-110 ${
            pathname.startsWith("/portal/one-on-one") ? "ring-2 ring-blue/40 ring-offset-2 ring-offset-ink" : ""
          }`}
        >
          <span aria-hidden>★</span>
          One-on-one support
        </Link>
      )}
    </nav>
  );
}
