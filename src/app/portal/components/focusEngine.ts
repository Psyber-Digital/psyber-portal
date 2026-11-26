"use client";

// One focus-sound player for the whole portal (Don, card PU, 25 Nov 2026:
// "Focused music should stay on across tabs"). It lives at module level, so
// moving between Today, Program, The List and My plan never stops it. It only
// stops when the member presses stop, or closes or reloads the page.

const LOOP_URL = "/audio/focus-loop.wav"; // Life Inspired, 12 beats (Don, card FM4 = B, 26 Nov 2026)
type State = { on: boolean; busy: boolean };
let state: State = { on: false, busy: false };
let ctx: AudioContext | null = null;
let src: AudioBufferSourceNode | null = null;
let decoded: Promise<ArrayBuffer> | null = null;
const subs = new Set<(s: State) => void>();

function emit(next: Partial<State>) {
  state = { ...state, ...next };
  subs.forEach((f) => f(state));
}

export function subscribe(f: (s: State) => void): () => void {
  subs.add(f);
  f(state);
  return () => {
    subs.delete(f);
  };
}

export function stopFocus() {
  try {
    src?.stop();
  } catch {
    /* already stopped */
  }
  src = null;
  emit({ on: false });
}

export async function startFocus() {
  if (state.busy || state.on) return;
  emit({ busy: true });
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") await ctx.resume();
    if (!decoded) decoded = fetch(LOOP_URL).then((r) => r.arrayBuffer());
    // decodeAudioData detaches its input, so give it a copy.
    const buffer = await ctx.decodeAudioData((await decoded).slice(0));
    const s = ctx.createBufferSource();
    s.buffer = buffer;
    s.loop = true;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.8);
    s.connect(gain).connect(ctx.destination);
    s.start();
    src = s;
    emit({ on: true });
  } catch (e) {
    console.error("focus sound failed:", e);
    emit({ on: false });
  } finally {
    emit({ busy: false });
  }
}

export function toggleFocus() {
  if (state.on) stopFocus();
  else void startFocus();
}
