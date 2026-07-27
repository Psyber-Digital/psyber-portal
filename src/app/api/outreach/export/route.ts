import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { serialiseCsv } from "@/lib/csv";
import {
  correspondenceLabel,
  mediumLabel,
  relevanceLabel,
  statusLabel,
} from "@/lib/contacts";
import type { Contact } from "@/lib/types";

// Exports the signed-in user's contact database as CSV. Read as the user, so RLS
// is the gate — there is no path here to anyone else's list.
//
// Column order matches the programme's own Contact Database worksheet, so an
// export can be dropped straight back into the spreadsheet clients already know.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Contact[];

  // Column order is the spreadsheet's, so an export drops straight back into the
  // Contact Database sheet. Relevance and Next Follow-up are appended at the end
  // rather than inserted, so the original nine columns stay where they were.
  const csv = serialiseCsv([
    [
      "Name",
      "Email Address",
      "Phone Number",
      "First Contact Date",
      "Correspondence",
      "Medium",
      "Last Contact Date",
      "Status",
      "Notes",
      "Relevance",
      "Next Follow-up",
    ],
    ...rows.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.first_contact_date,
      correspondenceLabel(c.correspondence),
      mediumLabel(c.medium),
      c.last_contact_date,
      statusLabel(c.status),
      c.notes,
      relevanceLabel(c.relevance),
      c.next_followup_date,
    ]),
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contact-database-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
