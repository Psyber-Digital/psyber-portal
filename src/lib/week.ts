// Small shared helpers for week presentation.

export const pad = (n: number) => String(n).padStart(2, "0");

// Strip a leading "Week N —" from a title so we can render our own prefix
// without doubling up (handles em-dash, en-dash and hyphen).
export const stripWeekPrefix = (title: string) =>
  title.replace(/^week\s*\d+\s*[—–-]\s*/i, "").trim();
