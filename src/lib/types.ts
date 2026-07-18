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

export interface Settings {
  id: boolean;
  calendly_url: string;
  session_length: string;
  session_format: string;
}
