import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function Header({ name, role, below }: { name: string; role: "client" | "admin"; below?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-x-3 gap-y-3 border-b border-line pb-6">
      <Image
        src="/wordmark.png"
        alt="Psyber Digital"
        width={200}
        height={38}
        priority
        className="order-1 h-[26px] w-auto shrink-0 sm:h-[30px]"
      />
      {/* min-w-0 + truncate: on a narrow phone the name shrinks with an ellipsis
          rather than pushing "Sign out" off-screen (which used to force the whole
          page wider than the viewport). The badge and button never shrink.
          At 390px even an empty name left "Sign out" 35px off-screen, so the
          badge is hidden on phones (found 30 Oct). */}
      <div className="order-3 flex min-w-0 items-center gap-2.5 text-[13px] text-sec sm:order-2 sm:gap-3.5">
        <span
          className={`hidden shrink-0 rounded-full px-2.5 py-1 sm:inline font-disp text-[10px] uppercase tracking-[1.5px] ${
            role === "admin"
              ? "border border-blue/25 bg-blue/[0.12] text-blue"
              : "border border-orange/40 bg-orange/[0.14] text-orange"
          }`}
        >
          {role === "admin" ? "Admin" : "Client"}
        </span>
        <span className="min-w-0 truncate font-semibold text-off">{name}</span>
        <Link
          href="/portal/account"
          className="psy-btn-ghost shrink-0 !px-3.5 !py-2 !text-[13px]"
        >
          Account
        </Link>
        <form action="/auth/signout" method="post" className="shrink-0">
          <button type="submit" className="psy-btn-ghost !px-3.5 !py-2 !text-[13px]">
            Sign out
          </button>
        </form>
      </div>
      {/* Under the logo, top left: level and points on Today (card PU). */}
      {below && <div className="order-2 w-full sm:order-3">{below}</div>}
    </header>
  );
}
