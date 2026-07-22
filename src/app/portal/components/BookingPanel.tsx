"use client";

import Script from "next/script";
import type { Settings } from "@/lib/types";

// Booking panel. Opens the Calendly popup themed to brand; falls back to a new
// tab if the widget script hasn't loaded. URL comes from admin settings.
export function BookingPanel({ id, settings }: { id: string; settings: Settings }) {
  const branded =
    settings.calendly_url +
    (settings.calendly_url.includes("?") ? "&" : "?") +
    "hide_gdpr_banner=1&background_color=0B1220&text_color=F4F7FB&primary_color=1E90FF";

  function openBooking() {
    const w = window as unknown as {
      Calendly?: { initPopupWidget: (o: { url: string }) => void };
    };
    if (w.Calendly?.initPopupWidget) {
      w.Calendly.initPopupWidget({ url: branded });
    } else {
      window.open(settings.calendly_url, "_blank", "noopener");
    }
  }

  return (
    <section
      id={id}
      className="psy-card relative mt-10 flex flex-wrap items-center justify-between gap-6 overflow-hidden p-7"
      style={{
        backgroundImage:
          "linear-gradient(120deg,#12203a 0%,#121B2E 55%,#0f1728 100%)",
      }}
    >
      <link
        rel="stylesheet"
        href="https://assets.calendly.com/assets/external/widget.css"
      />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
      />
      <span className="pointer-events-none absolute left-0 top-0 h-px w-full animate-[psySweep_5.5s_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent,#1E90FF,transparent)]" />

      <div className="relative min-w-[250px] flex-1">
        <div className="psy-eyebrow text-blue">Next Session</div>
        <h3 className="mt-2 font-disp text-[19px] font-semibold leading-tight">
          The work continues in the room.
        </h3>
        <p className="mt-2 max-w-[50ch] text-[13.5px] leading-relaxed text-slate">
          When you’re ready for the next step, choose a time that suits you. Your
          next week unlocks after we meet.
        </p>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {[settings.session_length, settings.session_format, "Confirmed instantly"].map(
            (chip) => (
              <span
                key={chip}
                className="rounded-md border border-line px-2.5 py-1 font-disp text-[10px] uppercase tracking-[1.5px] text-slate"
              >
                {chip}
              </span>
            ),
          )}
        </div>
      </div>

      <div className="relative text-center">
        <button onClick={openBooking} className="psy-btn group whitespace-nowrap !px-[22px] !py-[13px]">
          Arrange your next session{" "}
          <span className="transition group-hover:translate-x-1">→</span>
        </button>
        <span className="mt-2.5 block text-[11px] text-dim">
          Opens your booking calendar
        </span>
      </div>

      <style jsx global>{`
        @keyframes psySweep {
          0% {
            transform: translateX(-100%);
          }
          55%,
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </section>
  );
}
