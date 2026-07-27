export type Role = "client" | "admin";
export type FileKind = "worksheet" | "resource";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  role: Role;
  current_week: number;
  created_at: string;
}

export interface Week {
  id: string;
  number: number;
  title: string;
  description: string;
  published: boolean;
  created_at: string;
}

// The program outline shown in the stepper: every session's number + title +
// published flag, but no draft content (description is deliberately omitted so
// unpublished sessions never leak their content to the client).
export type WeekOutline = Pick<Week, "id" | "number" | "title" | "published">;

export interface FileRow {
  id: string;
  week_id: string;
  kind: FileKind;
  title: string;
  storage_path: string;
  sort_order: number;
  owner_id: string | null;
  created_at: string;
}

// SHARED FILES — the two-way document exchange between coach and client.
// 'to_client' items expire (window chosen per item); 'to_coach' uploads have a
// null expires_at and persist until the coach deletes them.
export type ShareDirection = "to_client" | "to_coach";

export interface SharedFile {
  id: string;
  client_id: string;
  direction: ShareDirection;
  title: string;
  note: string;
  storage_path: string;
  size_bytes: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  expires_at: string | null;
  downloaded_at: string | null;
  created_at: string;
}

// OUTREACH — the client's own contact database. Private to them; no admin path.
// The vocabularies mirror the programme's Contact Database spreadsheet.
export type ContactRelevance = "relevant" | "irrelevant" | "unsure";
export type ContactCorrespondence = "" | "message_1" | "follow_up_1" | "follow_up_2";
export type ContactMedium =
  | ""
  | "face_to_face"
  | "video"
  | "voice"
  | "instant_message"
  | "dm"
  | "email";
export type ContactStatus =
  | "not_contacted"
  | "contacted"
  | "replied"
  | "interested"
  | "not_interested"
  | "follow_up_required"
  | "converted";

export interface Contact {
  id: string;
  owner_id: string;
  name: string;
  email: string;
  phone: string;
  relevance: ContactRelevance;
  correspondence: ContactCorrespondence;
  medium: ContactMedium;
  status: ContactStatus;
  first_contact_date: string | null;
  last_contact_date: string | null;
  next_followup_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: boolean;
  calendly_url: string;
  session_length: string;
  session_format: string;
}
