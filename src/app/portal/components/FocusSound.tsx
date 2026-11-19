"use client";

import { useEffect, useRef, useState } from "react";

// A short, catchy loop for when a member sits down to do a move (Don, board m19,
// 19 Nov 2026: "change the focus sound to a catchy few second loop"). The file
// is "Lofi Beat Loop" by BFCMUSIC from Pixabay (public/audio/CREDITS.md; Don's
// pick, m21 "A"), played on repeat through Web Audio so the seam doesn't gap. It never starts
// on its own. The wording makes no claim about what it does to the brain.

const LOOP_URL = "/audio/focus-loop.mp3";
let decoded: Promise<ArrayBuffer> | null = null;

async function loadLoop(ac: AudioContext): Promise<AudioBuffer> {
  if (!decoded) decoded = fetch(LOOP_URL).then((r) => r.arrayBuffer());
  // decodeAudioData detaches its input, so give it a copy.
  return ac.decodeAudioData((await decoded).slice(0));
}

export function FocusSound() {
  const [on, setOn] = useState(false);
  const [info, setInfo] = useState(false);
  // The first start fetches and decodes the file, so a second press while that
  // runs must not start a second copy on top.
  const [busy, setBusy] = useState(false);
  const ctx = useRef<AudioContext | null>(null);
  const src = useRef<AudioBufferSourceNode | null>(null);

  const stop = () => {
    try {
      src.current?.stop();
    } catch {
      /* already stopped */
    }
    src.current = null;
  };

  useEffect(() => () => {
    stop();
    ctx.current?.close().catch(() => {});
  }, []);

  const toggle = async () => {
    if (busy) return;
    if (on) {
      stop();
      setOn(false);
      return;
    }
    setBusy(true);
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!ctx.current) ctx.current = new AC();
      const ac = ctx.current;
      if (ac.state === "suspended") await ac.resume();
      const s = ac.createBufferSource();
      s.buffer = await loadLoop(ac);
      s.loop = true;
      const gain = ac.createGain();
      gain.gain.setValueAtTime(0, ac.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ac.currentTime + 0.8);
      s.connect(gain).connect(ac.destination);
      s.start();
      src.current = s;
      setOn(true);
    } catch (e) {
      console.error("focus sound failed:", e);
      setOn(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        className={`rounded-full border px-3.5 py-1.5 font-disp text-[12.5px] font-semibold ${
          on ? "border-blue bg-blue/15 text-blue" : "border-orange/60 bg-orange/10 text-orange hover:bg-orange/20"
        }`}
      >
        {busy ? "♪ Starting…" : on ? "♪ Focus sound on" : "♪ Focus sound"}
      </button>
      <button
        type="button"
        onClick={() => setInfo((v) => !v)}
        aria-expanded={info}
        aria-label="What is the focus sound?"
        className="grid h-6 w-6 place-items-center rounded-full border border-line font-disp text-[12px] font-semibold text-mut hover:text-off"
      >
        i
      </button>
      {info && (
        <div role="note" className="absolute right-0 top-10 z-20 max-w-[320px] rounded-[14px] border border-line bg-panel p-4 text-[13px] leading-relaxed text-sec shadow-card">
          <b className="block font-disp text-[13.5px] font-semibold text-off">Focus sound</b>
          A short, catchy loop to work to. Turn it on when you sit down to a move, and off when you finish. It
          plays only on this device, while this page is open.
        </div>
      )}
    </div>
  );
}
