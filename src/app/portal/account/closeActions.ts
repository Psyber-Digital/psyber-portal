"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { SHARED_BUCKET } from "@/lib/shared";

// "Close my account" for self-serve members (Build terms 8.2 and 10.3). Deletes
// the login, which cascades to the profile, contact list, sign-up answers,
// subscription record and shared-file rows (see the migrations). The shared
// files' bytes are removed first, because a row cascade can't reach Storage.
// Flagship clients and admins can't use this: their accounts are Don's to close.

export type CloseState = { error?: string };

const LIVE = ["active", "trialing", "past_due"];

export async function closeAccount(
  _prev: CloseState,
  formData: FormData,
): Promise<CloseState> {
  if (formData.get("confirm_close") !== "on")
    return { error: "Tick the box to confirm." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role === "admin" || !["foundations", "build"].includes(profile.tier))
    return { error: "Please reply to any email from us and we'll close your account." };

  const admin = createAdminClient();

  // 1. Stop any payment first. If this fails, nothing else happens.
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (sub?.stripe_subscription_id && LIVE.includes(sub.status ?? "")) {
    try {
      await stripe().subscriptions.cancel(sub.stripe_subscription_id);
    } catch (e) {
      console.error("close account: cancel failed:", e);
      return { error: "We couldn’t stop your membership. Please try again." };
    }
  }

  // 2. Remove the bytes of any shared files.
  const { data: files } = await admin
    .from("shared_files")
    .select("storage_path")
    .eq("client_id", user.id);
  const paths = (files ?? []).map((f) => f.storage_path as string);
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await admin.storage.from(SHARED_BUCKET).remove(paths.slice(i, i + 100));
    if (error) {
      console.error("close account: storage remove failed:", error.message);
      return { error: "Something went wrong. Please try again." };
    }
  }

  // 3. Delete the login. Everything else goes with it.
  const { error: delError } = await admin.auth.admin.deleteUser(user.id);
  if (delError) {
    console.error("close account: delete failed:", delError.message);
    return { error: "Something went wrong. Please try again." };
  }

  await supabase.auth.signOut();
  redirect("/closed");
}
