// Shared Files — constants and small helpers used by both the server actions and
// the UI. No Supabase imports here, so it is safe in client components.

export const SHARED_BUCKET = "shared-files";

// Must stay in step with allowed_mime_types / file_size_limit on the bucket in
// migration 0004. The bucket is the real enforcement point (Supabase rejects
// server-side); these exist so a client gets a civil message instead of a 400.
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ALLOWED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/heic",
  "image/heif",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

// What the file picker offers. Extensions as well as MIME types, because HEIC in
// particular is reported inconsistently across browsers.
export const UPLOAD_ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.heic,.heif,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx," +
  ALLOWED_MIME.join(",");

// The expiry windows the coach can choose when sending a document down.
export const EXPIRY_WINDOWS = [
  { hours: 24, label: "24 hours" },
  { hours: 48, label: "48 hours" },
  { hours: 168, label: "7 days" },
] as const;

export const DEFAULT_EXPIRY_HOURS = 48;

// A client's upload cap. Not a security boundary (the bucket's size limit is),
// just a guard against an accidental or careless flood of files.
export const MAX_CLIENT_UPLOADS = 20;

// A client-supplied filename ends up in a Content-Disposition header on download,
// so it can never carry quotes, newlines or control characters. Also caps the
// length and guarantees a non-empty result.
export function safeTitle(name: string): string {
  const cleaned = name
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/["\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || "document").slice(0, 120);
}

// Storage object names: ASCII-safe, no path traversal.
export function safeObjectName(name: string): string {
  return (name.replace(/[^\w.\-]+/g, "_").replace(/^\.+/, "") || "file").slice(0, 100);
}

// Browsers do not always declare a type. iPhones in particular hand over HEIC
// photos with an empty `file.type`, and Windows sometimes does the same for
// .docx. An empty type would be uploaded as application/octet-stream, which the
// bucket's allowed_mime_types list rejects — so infer from the extension first.
const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  heic: "image/heic",
  heif: "image/heif",
  webp: "image/webp",
  txt: "text/plain",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// Returns a MIME type the bucket will accept, or null if we can't vouch for the
// file — in which case the caller refuses it rather than guessing.
export function resolveMime(declared: string, filename: string): string | null {
  if (declared && (ALLOWED_MIME as readonly string[]).includes(declared)) return declared;
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  return EXT_MIME[ext] ?? null;
}

export function formatBytes(bytes: number | null): string {
  if (!bytes || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// "2 days left" / "5 hours left" / "48 minutes left" / "Expired".
// Deliberately coarse — this is reassurance, not a countdown timer.
export function timeLeft(expiresAt: string | null, now = Date.now()): string {
  if (!expiresAt) return "";
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return "Expired";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} left`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} left`;
  const days = Math.floor(hours / 24);
  return `${days} days left`;
}

// How old a client's upload is, used for the coach's 30-day tidy-up nudge.
export function daysOld(createdAt: string, now = Date.now()): number {
  return Math.floor((now - new Date(createdAt).getTime()) / 86400000);
}

export const STALE_UPLOAD_DAYS = 30;
