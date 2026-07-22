// Session materials hosted as static files in /public (per week). Used alongside any
// admin-uploaded files in Supabase storage. Session 1's materials are the programme's own
// generic reference assets (not client-specific), so serving them statically is fine.
//
// The workbook opens as an interactive page (new tab); resources open/download in place.

export type PortalResource = {
  href: string;
  label: string;
  open?: boolean;
  /** Small subtitle shown under the label on the resource card. */
  sub?: string;
  /** Glyph shown in the card's icon tile. */
  icon?: string;
};

export const WEEK_WORKBOOK: Record<number, PortalResource | undefined> = {
  1: {
    href: "/session-01/Session-1-Foundations-Workbook.html",
    label: "Open your workbook",
    open: true,
  },
};

export const WEEK_RESOURCES: Record<number, PortalResource[]> = {
  1: [
    {
      href: "/session-01/Session-1-Playbook.pdf",
      label: "The Playbook",
      sub: "Four reference sheets · PDF",
      icon: "▤",
      open: true,
    },
    {
      href: "/session-01/Resource-Mindset-Reminders-v2.pdf",
      label: "Mindset Reminders",
      sub: "Daily prompts · PDF",
      icon: "◈",
      open: true,
    },
    {
      href: "/session-01/Resource-Therapist-to-Coach-Snapshot-v2.pdf",
      label: "Therapist → Coach Snapshot",
      sub: "The lens flip at a glance · PDF",
      icon: "⇄",
      open: true,
    },
  ],
};

export const weekWorkbook = (n: number) => WEEK_WORKBOOK[n];
export const weekResources = (n: number): PortalResource[] => WEEK_RESOURCES[n] ?? [];
