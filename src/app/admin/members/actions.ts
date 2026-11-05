"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Don marks a call as booked, which stops that member's upgrade emails for good.
// Runs as the signed-in admin: the profiles admin policy (0002) is the gate, so
// a member calling this action changes nothing.
export async function markCallBooked(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ call_booked_at: new Date().toISOString() })
    .eq("id", id)
    .is("call_booked_at", null);
  if (error) console.error("markCallBooked failed:", error.message);

  revalidatePath("/admin/members");
}
