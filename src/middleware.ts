import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session on every request and gates portal routes.
// Unauthenticated users hitting a protected route are sent to /login.
//
// Session materials (/session-NN/*) live in /public so build_v3.py can write
// them, but they are not public: a file for session N is served only to a
// signed-in user whose current_week >= N, and only once week N is published.
// Admin sees everything. Same rule as the files RLS policy (0002_rls.sql).
// Offer Ladder build, stage 2 (ADR-0027).
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/portal") || path.startsWith("/admin");
  const session = path.match(/^\/session-(\d+)\//);

  if ((isProtected || session) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (session && user) {
    const n = parseInt(session[1], 10);
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, current_week")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      // RLS returns only published weeks to clients, so no row = not published.
      const { data: week } = await supabase
        .from("weeks")
        .select("number")
        .eq("number", n)
        .eq("published", true)
        .maybeSingle();

      if (!profile || profile.current_week < n || !week) {
        return new NextResponse("This session isn't open for you yet.", {
          status: 403,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*", "/(session-\\d+)/:path*"],
};
