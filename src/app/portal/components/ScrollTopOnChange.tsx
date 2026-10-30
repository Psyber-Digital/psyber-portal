"use client";

import { useEffect, useRef } from "react";

// Back to the top of the page when `value` changes after the first render.
// The portal passes the member's completed-session count, so marking a session
// complete takes them to the top, where the next session now shows (Don, r33,
// 30 Oct). It sits above the parts that re-draw, so it keeps its memory.
export function ScrollTopOnChange({ value }: { value: number }) {
  const last = useRef(value);
  useEffect(() => {
    if (last.current !== value) window.scrollTo({ top: 0, behavior: "instant" });
    last.current = value;
  }, [value]);
  return null;
}
