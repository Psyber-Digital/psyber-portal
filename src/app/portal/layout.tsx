import { FocusDock } from "./components/FocusDock";

// Shared by every portal page. It stays mounted as members move between pages,
// so the focus sound keeps playing (card PU, 25 Nov 2026).
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FocusDock />
    </>
  );
}
