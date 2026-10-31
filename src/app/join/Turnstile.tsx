"use client";

import { useEffect, useRef } from "react";

// Cloudflare Turnstile spam check on the sign-up form (go-live runbook item 7;
// Don's pick on board card m43, 31 Oct). The widget puts its token in a hidden
// "cf-turnstile-response" field inside the form; the join action checks it
// with Cloudflare before anything reaches the database.
//
// A token works once. resetOn changes after every submit, so a failed attempt
// gets a fresh check instead of a spent token.

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = "cf-turnstile-script";

export function Turnstile({ siteKey, resetOn }: { siteKey: string; resetOn: unknown }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string>();

  useEffect(() => {
    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      document.head.appendChild(s);
    }
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const draw = () => {
      if (stopped || !box.current) return;
      if (!window.turnstile) {
        timer = setTimeout(draw, 200);
        return;
      }
      widget.current = window.turnstile.render(box.current, { sitekey: siteKey, theme: "dark" });
    };
    draw();
    return () => {
      stopped = true;
      clearTimeout(timer);
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = undefined;
    };
  }, [siteKey]);

  useEffect(() => {
    if (widget.current && window.turnstile) window.turnstile.reset(widget.current);
  }, [resetOn]);

  return <div ref={box} className="mt-4 min-h-[65px]" />;
}
