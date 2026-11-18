import { redirect } from "next/navigation";

// Progress lives on Today, under the move card (Don, board m16, 18 Nov 2026:
// "Doesn't need to be in the Progress page too"). Old links land there.
export default function ProgressPage() {
  redirect("/portal");
}
