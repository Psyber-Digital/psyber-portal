// Per-week unlock email content, loaded from the editable text files at the
// project root: emails/week-NN.txt (one file per week). Editing those files IS
// editing the emails — see emails/README.txt for the format.
//
// Server-only (uses fs): imported by email.ts / the admin action, never a client
// component. A week with no file sends NO email (we never send generic filler).

import fs from "node:fs";
import path from "node:path";

export type WeekEmail = {
  subject: string;
  paragraphs: string[];
};

const EMAILS_DIR = path.join(process.cwd(), "emails");

// Parse the simple format: a "Subject:" first line, then blank-line-separated
// paragraphs. Single newlines inside a block are treated as soft wraps (joined
// to one paragraph), so hand-wrapped text still renders cleanly.
function parseEmail(raw: string): WeekEmail | null {
  const text = raw.replace(/\r\n/g, "\n").trim();
  const firstBreak = text.indexOf("\n");
  const firstLine = (firstBreak === -1 ? text : text.slice(0, firstBreak)).trim();
  const subjectMatch = firstLine.match(/^Subject:\s*(.+)$/i);
  if (!subjectMatch) return null;

  const subject = subjectMatch[1].trim();
  const body = firstBreak === -1 ? "" : text.slice(firstBreak + 1);
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  if (!subject || paragraphs.length === 0) return null;
  return { subject, paragraphs };
}

export function weekEmail(n: number): WeekEmail | undefined {
  const file = path.join(EMAILS_DIR, `week-${String(n).padStart(2, "0")}.txt`);
  try {
    return parseEmail(fs.readFileSync(file, "utf8")) ?? undefined;
  } catch {
    return undefined; // no file (or unreadable) → no email for this week
  }
}
