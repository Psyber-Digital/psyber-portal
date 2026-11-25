import { PortalScreen } from "./PortalScreen";

// Today: the move card and nothing else (structure A, board m10, 18 Nov 2026).
export const dynamic = "force-dynamic";

export default function PortalPage({ searchParams }: { searchParams?: { week?: string; joined?: string; move?: string; opened?: string } }) {
  return <PortalScreen searchParams={searchParams} view="today" />;
}
