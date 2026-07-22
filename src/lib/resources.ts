// Session materials hosted as static files in /public (per week). Used alongside any
// admin-uploaded files in Supabase storage. Session 1's materials are the programme's own
// generic reference assets (not client-specific), so serving them statically is fine.
//
// The workbook opens as an interactive page (new tab); resources open/download in place.

export type PortalResource = { href: string; label: string; open?: boolean };

export const WEEK_WORKBOOK: Record<number, PortalResource | undefined> = {
  1: {
    href: "/session-01/Session-1-Foundations-Workbook.html",
    label: "Open your Foundations Workbook",
    open: true,
  },
};

export const WEEK_RESOURCES: Record<number, PortalResource[]> = {
  1: [
    { href: "/session-01/Session-1-Playbook.pdf", label: "The Playbook — four reference sheets", open: true },
    { href: "/session-01/Resource-Mindset-Reminders.pdf", label: "Mindset Reminders", open: true },
    { href: "/session-01/Resource-Therapist-to-Coach-Snapshot.pdf", label: "Therapist → Coach — Mindset Shift Snapshot", open: true },
  ],
};

export const weekWorkbook = (n: number) => WEEK_WORKBOOK[n];
export const weekResources = (n: number): PortalResource[] => WEEK_RESOURCES[n] ?? [];
