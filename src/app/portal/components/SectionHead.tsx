import type { ReactNode } from "react";

// Eyebrow label with a hairline rule running to the edge — the v2 section divider.
//
// The default was orange. A divider is furniture: it tells you where one part of the
// page ends and the next begins, and it is never the thing to act on — so it was
// spending the accent that should mark the next action. Muted by default from
// 4 Aug 2026; pass a tone explicitly where a section genuinely needs to shout.
export function SectionHead({
  children,
  tone = "mut",
}: {
  children: ReactNode;
  tone?: "mut" | "orange" | "blue";
}) {
  const colour =
    tone === "blue" ? "text-blue" : tone === "orange" ? "text-orange" : "text-mut";
  return (
    <div className="mx-0.5 mb-4 mt-9 flex items-center gap-3">
      <span className={`psy-eyebrow whitespace-nowrap ${colour}`}>{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
