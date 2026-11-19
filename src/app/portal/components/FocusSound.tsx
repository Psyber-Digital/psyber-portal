"use client";

import { useEffect, useRef, useState } from "react";

// A short, soft focus loop for when a member sits down to do a move (Don, board
// m19, 19 Nov 2026: "a stock loop audio... to activate flow state, like in the
// War Room, with an i which explains it"). It is made in the browser: a gentle
// low hum over soft, filtered noise, repeating every eight seconds. Nothing is
// downloaded, so there is no licence to manage. It never starts on its own.
// The wording makes no claim about what it does to the brain.

const LOOP_SECONDS = 8;

function makeLoop(ac: AudioContext): AudioBuffer {
  const rate = ac.sampleRate;
  const len = rate * LOOP_SECONDS;
  const buf = ac.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let brown = 0;
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      // Soft brown noise, like distant rain.
      brown = (brown + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      // A low, slow-breathing chord (A2 and E3), one breath per loop so it repeats seamlessly.
      const breath = 0.55 + 0.45 * Math.sin((2 * Math.PI * t) / LOOP_SECONDS - Math.PI / 2);
      const hum = 0.05 * Math.sin(2 * Math.PI * 110 * t) + 0.035 * Math.sin(2 * Math.PI * 164.81 * t + ch);
      d[i] = brown * 2.2 + hum * breath;
    }
    // Fade the seam so the loop never clicks.
    const fade = Math.floor(rate * 0.05);
    for (let i = 0; i < fade; i++) {
      const k = i / fade;
      d[i] *= k;
      d[len - 1 - i] *= k;
    }
  }
  return buf;
}

export function FocusSound() {
  const [on, setOn] = useState(false);
  const [info, setInfo] = useState(false);
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
    if (on) {
      stop();
      setOn(false);
      return;
    }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!ctx.current) ctx.current = new AC();
      const ac = ctx.current;
      if (ac.state === "suspended") await ac.resume();
      const s = ac.createBufferSource();
      s.buffer = makeLoop(ac);
      s.loop = true;
      const gain = ac.createGain();
      gain.gain.setValueAtTime(0, ac.currentTime);
      gain.gain.linearRampToValueAtTime(0.6, ac.currentTime + 1.5);
      s.connect(gain).connect(ac.destination);
      s.start();
      src.current = s;
      setOn(true);
    } catch {
      setOn(false);
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
        {on ? "♪ Focus sound on" : "♪ Focus sound"}
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
          A soft, steady sound to work to, like distant rain. Turn it on when you sit down to a move, and off when
          you finish. It plays only on this device, while this page is open.
        </div>
      )}
    </div>
  );
}
