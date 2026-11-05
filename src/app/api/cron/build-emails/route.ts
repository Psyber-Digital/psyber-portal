import { type NextRequest, NextResponse } from "next/server";
import { runDailyBuildEmails } from "@/lib/buildEmails";
import { runDailyUpsellEmails } from "@/lib/upsellEmails";

export const dynamic = "force-dynamic";
// Never reuse a cached database read: found 29 Oct, the job sent a reminder
// from a stale copy of a member's lapse date.
export const fetchCache = "force-no-store";
export const revalidate = 0;

// Daily: Build members' place reminders (7 days and 1 day before their place
// is released) and yearly renewal reminders (21 days before). Scheduled from
// vercel.json. Every email is sent at most once (email_log, 0014), so a
// repeated run is harmless.
//
// Only Vercel Cron may call it: `Authorization: Bearer $CRON_SECRET`. With no
// CRON_SECRET configured it refuses everyone.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const report = await runDailyBuildEmails();
  console.log("build emails:", JSON.stringify(report));
  const upsell = await runDailyUpsellEmails();
  console.log("upsell emails:", JSON.stringify(upsell));
  return NextResponse.json({ report, upsell });
}
