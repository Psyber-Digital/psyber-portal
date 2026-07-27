import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SHARED_BUCKET } from "@/lib/shared";

// Secure download for Shared Files — the same two-stage pattern as
// /api/download/[fileId]:
//   1. Read the row as the signed-in user. RLS decides. For a client that means
//      their own row AND, for anything the coach sent, one that hasn't expired.
//      No row => 403.
//   2. Only then sign a 60-second URL with the service role and redirect.
// A copied link is useless to anyone not entitled, and dies in a minute.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Stage 1 — RLS-enforced visibility check. Expiry is part of the policy, so an
  // expired file 403s here even though its bytes may still be in storage.
  const { data: file } = await supabase
    .from("shared_files")
    .select("id, storage_path, title")
    .eq("id", params.id)
    .single();

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 403 });
  }

  // Stage 2 — sign, using the service role, only after the check passed.
  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage
    .from(SHARED_BUCKET)
    .createSignedUrl(file.storage_path as string, 60, {
      download: file.title as string,
    });

  if (error || !signed) {
    return NextResponse.json({ error: "Could not sign URL" }, { status: 500 });
  }

  // Record the collection, so the coach can see whether a document was picked up
  // before it expired. Best-effort — never block the download on it.
  await admin
    .from("shared_files")
    .update({ downloaded_at: new Date().toISOString() })
    .eq("id", file.id as string)
    .is("downloaded_at", null);

  return NextResponse.redirect(signed.signedUrl);
}
