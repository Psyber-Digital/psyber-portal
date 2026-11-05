import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unsubscribeTokenOk } from "@/lib/upsellEmails";

export const dynamic = "force-dynamic";

// Unsubscribe from the upsell emails. The link is signed for one person, so it
// needs no sign-in. Opening it only shows a button: mail scanners follow links,
// and following one must not unsubscribe anybody. Mail apps' own one-click
// unsubscribe sends a POST, which is the part that acts.

const page = (title: string, body: string) =>
  new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#28324a;">
<main style="max-width:430px;margin:12vh auto 0;padding:32px;background:#fff;border:1px solid #e3e9f2;border-radius:12px;">
<h1 style="margin:0 0 12px;font-size:20px;color:#0B1220;">${title}</h1>${body}</main></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );

function params(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return { u: searchParams.get("u") ?? "", t: searchParams.get("t") ?? "" };
}

const valid = (u: string, t: string) => {
  try {
    return /^[0-9a-f-]{36}$/i.test(u) && unsubscribeTokenOk(u, t);
  } catch {
    return false;
  }
};

const BAD = () =>
  page("This link isn't valid", '<p style="margin:0;line-height:1.6;">Reply to any of our emails, and we\'ll take you off the list.</p>');

export async function GET(request: NextRequest) {
  const { u, t } = params(request);
  if (!valid(u, t)) return BAD();
  return page(
    "Unsubscribe from these emails?",
    `<p style="margin:0 0 20px;line-height:1.6;">We'll stop sending you emails about our programs. Your account stays open, and you'll still get emails about your account.</p>
<form method="post" action="/unsubscribe?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}"><button type="submit" style="background:#1E90FF;color:#fff;border:0;border-radius:8px;padding:12px 20px;font-size:15px;font-weight:700;cursor:pointer;">Unsubscribe</button></form>`,
  );
}

export async function POST(request: NextRequest) {
  const { u, t } = params(request);
  if (!valid(u, t)) return BAD();
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ upsell_unsubscribed_at: new Date().toISOString() })
    .eq("id", u)
    .is("upsell_unsubscribed_at", null);
  if (error) {
    console.error("unsubscribe failed:", error.message);
    return page("Something went wrong", '<p style="margin:0;line-height:1.6;">Please try again, or reply to any of our emails and we\'ll take you off the list.</p>');
  }
  return page("You're unsubscribed", '<p style="margin:0;line-height:1.6;">We won\'t send you any more of these emails.</p>');
}
