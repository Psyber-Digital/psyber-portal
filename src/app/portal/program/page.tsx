import { PortalScreen } from "../PortalScreen";

// The Program page: the journey and every unlocked session's materials
// (structure A, board m10, 18 Nov 2026). Same data as the home page.
export const dynamic = "force-dynamic";

export default function ProgramPage({ searchParams }: { searchParams?: { week?: string; joined?: string } }) {
  return <PortalScreen searchParams={searchParams} view="program" />;
}
