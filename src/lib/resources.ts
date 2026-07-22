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
  2: {
    href: "/session-02/Session-2-Niche-Workbook.html",
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
  2: [
    {
      href: "/session-02/Niche-Playbook.pdf",
      label: "The Niche Playbook",
      sub: "The session's thinking · PDF",
      icon: "▤",
      open: true,
    },
    {
      href: "/session-02/Niche-Framework-Instructions.pdf",
      label: "The Selection Framework",
      sub: "The 11-step framework · PDF",
      icon: "▦",
      open: true,
    },
    {
      href: "/session-02/Menu-Transformations.pdf",
      label: "Transformations Menu",
      sub: "Idea prompts · PDF",
      icon: "☰",
      open: true,
    },
    {
      href: "/session-02/Menu-Audiences.pdf",
      label: "Audiences Menu",
      sub: "Idea prompts · PDF",
      icon: "☰",
      open: true,
    },
    {
      href: "/session-02/Menu-Types-of-Coaching.pdf",
      label: "Types of Coaching Menu",
      sub: "Idea prompts · PDF",
      icon: "☰",
      open: true,
    },
    {
      href: "/session-02/Niche-Examples.pdf",
      label: "Niche Examples",
      sub: "Worked propositions · PDF",
      icon: "❝",
      open: true,
    },
  ],
};

// Print-ready (black-and-white, white-background) versions of the same resources,
// for clients who'd rather print them. Same materials, ink-friendly. Only listed
// where a print version has actually been produced.
export const WEEK_PRINT_RESOURCES: Record<number, PortalResource[]> = {
  1: [
    {
      href: "/session-01/Session-1-Playbook-Print-BW.pdf",
      label: "The Playbook",
      sub: "Black & white · PDF",
      icon: "▤",
      open: true,
    },
    {
      href: "/session-01/Resource-Mindset-Reminders-Print-BW.pdf",
      label: "Mindset Reminders",
      sub: "Black & white · PDF",
      icon: "◈",
      open: true,
    },
    {
      href: "/session-01/Resource-Therapist-to-Coach-Snapshot-Print-BW.pdf",
      label: "Therapist → Coach Snapshot",
      sub: "Black & white · PDF",
      icon: "⇄",
      open: true,
    },
  ],
};

export const weekWorkbook = (n: number) => WEEK_WORKBOOK[n];
export const weekResources = (n: number): PortalResource[] => WEEK_RESOURCES[n] ?? [];
export const weekPrintResources = (n: number): PortalResource[] => WEEK_PRINT_RESOURCES[n] ?? [];
