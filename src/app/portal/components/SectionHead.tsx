import type { ReactNode } from "react";

// Eyebrow label with a hairline rule running to the edge — the v2 section divider.
export function SectionHead({
  children,
  tone = "orange",
}: {
  children: ReactNode;
  tone?: "orange" | "blue";
}) {
  return (
    <div className="mx-0.5 mb-4 mt-9 flex items-center gap-3">
      <span
        className={`psy-eyebrow whitespace-nowrap ${tone === "blue" ? "text-blue" : "text-orange"}`}
      >
        {children}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
