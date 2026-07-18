import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Secure download. Two-stage:
//   1. Access check as the signed-in user — RLS decides if they may see this
//      file row at all. No row => 403. This is the whole gate.
//   2. Only then, sign a short-lived URL with the service role and redirect.
// A shared/copied link is useless to anyone not entitled, and expires fast.
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } },
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Stage 1 — RLS-enforced visibility check.
  const { data: file } = await supabase
    .from("files")
    .select("storage_path, title")
    .eq("id", params.fileId)
    .single();

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 403 });
  }

  // Stage 2 — sign, using service role, only after the check passed.
  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage
    .from("worksheets")
    .createSignedUrl(file.storage_path, 60, { download: file.title });

  if (error || !signed) {
    return NextResponse.json({ error: "Could not sign URL" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
