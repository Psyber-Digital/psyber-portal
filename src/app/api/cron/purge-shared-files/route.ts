import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { purgeExpiredSharedFiles } from "@/lib/purge";

export const dynamic = "force-dynamic";

// Hourly sweep that removes the bytes of expired coach→client documents.
// Scheduled from vercel.json. Expiry itself is enforced by RLS (see 0004), so a
// missed run is untidy, never unsafe.
//
// Two ways in:
//   · Vercel Cron — sends `Authorization: Bearer $CRON_SECRET`.
//   · A signed-in admin — so Asher can run it by hand from the dashboard.
// If CRON_SECRET is not configured, the header route is refused outright rather
// than left open.
//
// Add ?dry=1 to see what WOULD be deleted without deleting anything. Run it that
// way first after any change to the query.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  const viaCron = Boolean(secret) && header === `Bearer ${secret}`;

  let authorised = viaCron;
  if (!authorised) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      authorised = profile?.role === "admin";
    }
  }

  if (!authorised) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dry") === "1";
  const result = await purgeExpiredSharedFiles({ dryRun });

  console.log("shared-files purge:", JSON.stringify(result));
  return NextResponse.json(result, { status: result.error ? 500 : 200 });
}
