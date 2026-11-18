// A small burst of brand colour, for Done and for a new milestone (Don, r01:
// "dare I say fun?"). Plain DOM, outside React, so a page refresh after a
// server action does not cut it short. Skipped for anyone who asks their
// device for reduced motion.
export function burstAt(x: number, y: number) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const box = document.createElement("div");
  box.className = "psy-burst";
  box.style.left = `${x}px`;
  box.style.top = `${y}px`;
  const colours = ["#FF8D1E", "#1E90FF", "#ffb36b", "#69b4ff", "#F4F7FB"];
  for (let i = 0; i < 22; i++) {
    const p = document.createElement("i");
    const a = Math.random() * Math.PI * 2;
    const d = 50 + Math.random() * 80;
    p.style.setProperty("--x", `${Math.cos(a) * d}px`);
    p.style.setProperty("--y", `${Math.sin(a) * d - 30}px`);
    p.style.background = colours[i % colours.length];
    box.appendChild(p);
  }
  document.body.appendChild(box);
  window.setTimeout(() => box.remove(), 1000);
}

export function burstFrom(el: Element) {
  const r = el.getBoundingClientRect();
  burstAt(r.left + r.width / 2, r.top + r.height / 2);
}
