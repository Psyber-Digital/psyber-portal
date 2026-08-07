"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The client's top-level navigation. Client-side only because it highlights the
// active section from the current path. Never rendered for the admin — the admin
// dashboard has its own tab strip.
const TABS = [
  { href: "/portal", label: "This week" },
  { href: "/portal/shared", label: "Shared Files" },
  { href: "/portal/outreach", label: "The List" },
];

export function PortalNav({ badge }: { badge?: number }) {
  const pathname = usePathname();

  return (
    <nav className="-mt-2 mb-7 flex flex-wrap gap-2">
      {TABS.map((t) => {
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
    </nav>
  );
}
