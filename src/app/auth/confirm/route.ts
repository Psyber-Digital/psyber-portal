import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendDueUpsell } from "@/lib/upsellEmails";

// The first upsell email goes the moment an email is confirmed. Safe on every
// sign-in: anything already sent is skipped, and it never blocks the redirect.
async function afterConfirm(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase.auth.getUser();
  if (data.user) await sendDueUpsell(data.user.id);
}

// Magic-link landing route. Supabase sends the user here with a token_hash;
// we verify it, which sets the session cookie, then send them onward.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Only a path on this site, never "//other.site" or "/\\other.site", so a
  // crafted email link can't send someone elsewhere after they sign in.
  const asked = searchParams.get("next") ?? "/";
  const next = /^\/(?![\/\\])/.test(asked) ? asked : "/";

  if (token_hash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      await afterConfirm(supabase);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Supabase's default email templates send a one-time ?code= instead of a
  // token_hash (the test project can't use custom templates without custom
  // SMTP). Accept that too. It needs the same browser that started sign-up.
  const code = searchParams.get("code");
  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await afterConfirm(supabase);
      return NextResponse.redirect(`${origin}${next}`);
    }
    // Supabase only issues a code after it has checked the email link, so the
    // email is confirmed. The exchange fails when the link opens in a different
    // browser from the one that signed up. Ask them to sign in here instead.
    console.error("confirm: code exchange failed:", error.message);
    return NextResponse.redirect(`${origin}/login?notice=confirmed`);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
