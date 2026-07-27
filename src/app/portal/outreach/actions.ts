"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/csv";
import {
  mapHeader,
  normaliseCorrespondence,
  normaliseDate,
  normaliseMedium,
  normaliseRelevance,
  normaliseStatus,
} from "@/lib/contacts";
import type { Contact } from "@/lib/types";

// Every action here runs entirely through the USER-SCOPED Supabase client. The
// service role is never touched — the contacts table has one owner-only RLS
// policy and no admin policy at all, and that is the whole access model. There
// is deliberately no code path in this application that reads another person's
// contact list.

const MAX_IMPORT_ROWS = 1000;
const MAX_TOTAL_CONTACTS = 5000;

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, user };
}

const str = (fd: FormData, key: string, max = 200) =>
  String(fd.get(key) ?? "").trim().slice(0, max);

export type ContactResult = { error?: string; added?: number };

export async function addContact(formData: FormData): Promise<ContactResult> {
  const { supabase, user } = await requireUser();

  const name = str(formData, "name", 120);
  if (!name) return { error: "A name is the one thing that's required." };

  const { error } = await supabase.from("contacts").insert({
    owner_id: user.id,
    name,
    email: str(formData, "email", 200),
    phone: str(formData, "phone", 60),
    relevance: normaliseRelevance(str(formData, "relevance")),
    correspondence: normaliseCorrespondence(str(formData, "correspondence")),
    medium: normaliseMedium(str(formData, "medium")),
    status: normaliseStatus(str(formData, "status")),
    notes: str(formData, "notes", 2000),
    next_followup_date: normaliseDate(str(formData, "next_followup_date")),
  });
  if (error) return { error: error.message };

  revalidatePath("/portal/outreach");
  return { added: 1 };
}

// Inline edits from the table — a status change, a categorisation, a date. Only
// the listed fields can be set, so a crafted request can't rewrite owner_id.
const EDITABLE = [
  "name",
  "email",
  "phone",
  "relevance",
  "correspondence",
  "medium",
  "status",
  "notes",
  "first_contact_date",
  "last_contact_date",
  "next_followup_date",
] as const;

export async function updateContact(
  id: string,
  patch: Partial<Record<(typeof EDITABLE)[number], string | null>>,
): Promise<{ error?: string }> {
  const { supabase } = await requireUser();

  const clean: Record<string, string | null> = {};
  for (const key of EDITABLE) {
    if (!(key in patch)) continue;
    const raw = patch[key];
    if (key === "relevance") clean[key] = normaliseRelevance(String(raw ?? ""));
    else if (key === "correspondence")
      clean[key] = normaliseCorrespondence(String(raw ?? ""));
    else if (key === "medium") clean[key] = normaliseMedium(String(raw ?? ""));
    else if (key === "status") clean[key] = normaliseStatus(String(raw ?? ""));
    else if (key.endsWith("_date")) clean[key] = raw ? normaliseDate(String(raw)) : null;
    else clean[key] = String(raw ?? "").slice(0, 2000);
  }
  if (!Object.keys(clean).length) return {};

  clean.updated_at = new Date().toISOString();

  // No .eq("owner_id", ...) needed — the RLS policy already restricts this to
  // rows the user owns. Adding it would imply the policy wasn't trusted.
  const { error } = await supabase.from("contacts").update(clean).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/portal/outreach");
  return {};
}

export async function deleteContact(id: string): Promise<{ error?: string }> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/portal/outreach");
  return {};
}

export type ImportResult = {
  error?: string;
  added?: number;
  skipped?: number;
  warning?: string;
};

// CSV import. Requires a header row containing something recognisable as a name
// column; a single-column file with no header is treated as a plain list of
// names, because that's what a first pass at exhumation actually looks like.
export async function importContacts(formData: FormData): Promise<ImportResult> {
  const { supabase, user } = await requireUser();

  const file = formData.get("file") as File | null;
  if (!file || !file.size) return { error: "Choose a CSV file." };
  if (file.size > 5 * 1024 * 1024) return { error: "That file is over 5 MB." };

  const grid = parseCsv(await file.text());
  if (!grid.length) return { error: "That file appears to be empty." };

  const headerRow = grid[0];
  const mapped = headerRow.map(mapHeader);
  const hasName = mapped.includes("name");

  let records: Record<string, string>[] = [];

  if (hasName) {
    for (const row of grid.slice(1)) {
      const rec: Record<string, string> = {};
      mapped.forEach((field, i) => {
        if (field) rec[field] = (row[i] ?? "").trim();
      });
      records.push(rec);
    }
  } else if (headerRow.length === 1) {
    // No usable header and one column — read the whole file as names, including
    // the first row (it's a name, not a heading).
    records = grid.map((r) => ({ name: (r[0] ?? "").trim() }));
  } else {
    return {
      error:
        "I couldn't find a Name column. Add a header row with at least “Name” — Email, Phone, Status, Medium, Relevance and Notes are picked up too.",
    };
  }

  records = records.filter((r) => r.name);
  if (!records.length) return { error: "No named rows found in that file." };

  const skippedForLimit = Math.max(0, records.length - MAX_IMPORT_ROWS);
  records = records.slice(0, MAX_IMPORT_ROWS);

  const { count: existing } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true });
  if ((existing ?? 0) + records.length > MAX_TOTAL_CONTACTS)
    return { error: `That would take you past ${MAX_TOTAL_CONTACTS} contacts.` };

  const rows = records.map((r) => ({
    owner_id: user.id,
    name: r.name.slice(0, 120),
    email: (r.email ?? "").slice(0, 200),
    phone: (r.phone ?? "").slice(0, 60),
    relevance: normaliseRelevance(r.relevance ?? ""),
    correspondence: normaliseCorrespondence(r.correspondence ?? ""),
    medium: normaliseMedium(r.medium ?? ""),
    status: normaliseStatus(r.status ?? ""),
    notes: (r.notes ?? "").slice(0, 2000),
    first_contact_date: normaliseDate(r.first_contact_date ?? ""),
    last_contact_date: normaliseDate(r.last_contact_date ?? ""),
    next_followup_date: normaliseDate(r.next_followup_date ?? ""),
  }));

  // Chunked so a large import doesn't hit a single oversized request.
  let added = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from("contacts").insert(rows.slice(i, i + 200));
    if (error) return { error: error.message, added };
    added += Math.min(200, rows.length - i);
  }

  revalidatePath("/portal/outreach");
  return {
    added,
    skipped: skippedForLimit,
    warning: skippedForLimit
      ? `Only the first ${MAX_IMPORT_ROWS} rows were imported — ${skippedForLimit} were left out.`
      : undefined,
  };
}

// Quick bulk add: one name per line. The list is built continuously rather than
// in one sitting, so this is used repeatedly — names first, details later.
export async function addNames(formData: FormData): Promise<ImportResult> {
  const { supabase, user } = await requireUser();

  const names = String(formData.get("names") ?? "")
    .split(/\r?\n/)
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, MAX_IMPORT_ROWS);

  if (!names.length) return { error: "Paste at least one name." };

  const { count: existing } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true });
  if ((existing ?? 0) + names.length > MAX_TOTAL_CONTACTS)
    return { error: `That would take you past ${MAX_TOTAL_CONTACTS} contacts.` };

  const { error } = await supabase
    .from("contacts")
    .insert(names.map((name) => ({ owner_id: user.id, name: name.slice(0, 120) })));
  if (error) return { error: error.message };

  revalidatePath("/portal/outreach");
  return { added: names.length };
}

export type { Contact };
