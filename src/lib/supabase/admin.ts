import { createClient } from "@supabase/supabase-js";

// SERVICE-ROLE client. Bypasses Row Level Security entirely.
//
// SECURITY: this module must only ever be imported by server-only code
// (Route Handlers / Server Actions). The key is read from a non-public env var,
// so it can never reach the browser bundle. Use it ONLY after an access check
// has already been performed with the user-scoped server client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
