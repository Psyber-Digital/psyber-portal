// Outreach contact database — shared vocabulary and the messy-input normalisers
// used by CSV import. No Supabase imports, so this is safe in client components.
//
// The three dropdown vocabularies are taken verbatim from the programme's own
// Contact Database spreadsheet, so a client who started in Sheets recognises
// every option.

import type {
  ContactCorrespondence,
  ContactMedium,
  ContactRelevance,
  ContactStatus,
} from "@/lib/types";

export const STATUSES: {
  value: ContactStatus;
  label: string;
  tone: "grey" | "blue" | "orange" | "good" | "bad";
}[] = [
  { value: "not_contacted", label: "Not Contacted", tone: "grey" },
  { value: "contacted", label: "Contacted", tone: "blue" },
  { value: "replied", label: "Replied", tone: "blue" },
  { value: "interested", label: "Interested", tone: "orange" },
  { value: "follow_up_required", label: "Follow-Up Required", tone: "orange" },
  { value: "converted", label: "Converted to Client", tone: "good" },
  { value: "not_interested", label: "Not Interested", tone: "bad" },
];

// The message in the sequence they are on.
export const CORRESPONDENCES: { value: ContactCorrespondence; label: string }[] = [
  { value: "", label: "—" },
  { value: "message_1", label: "Message 1" },
  { value: "follow_up_1", label: "Follow Up 1" },
  { value: "follow_up_2", label: "Follow Up 2" },
];

// Warmest channel first — the ranking the Outreach Strategy teaches. The
// spreadsheet lists Email / DM / Instant Message / Face-To-Face; video and voice
// are added here because the strategy ranks them and the first wave of contacts
// is meant to use the warm end of this list, not the cold end.
// ORDER IS MEANINGFUL — do not sort this list alphabetically or "tidy" it.
//
// It runs from the most effective medium to the least, and the client is meant to
// pick the highest one the relationship will carry: face-to-face beats a video call,
// a video call beats a voice call, and all of them beat something written. How far up
// somebody can reach depends on how well they know the person, which is why this is a
// per-contact choice rather than one setting for the whole list.
//
// That ranking was implicit in the order for weeks with nothing on screen saying so —
// the field carried no explanation at all until 7 Aug 2026.
export const MEDIUMS: { value: ContactMedium; label: string }[] = [
  { value: "", label: "—" },
  { value: "face_to_face", label: "Face-To-Face" },
  { value: "video", label: "Video Call" },
  { value: "voice", label: "Phone / Voice Note" },
  { value: "instant_message", label: "Instant Message" },
  { value: "dm", label: "DM" },
  { value: "email", label: "Email" },
];

// Not a column in the spreadsheet, but step 2 of the strategy: decide whether the
// program is relevant to this person, or whether the objective is an introduction.
export const RELEVANCES: { value: ContactRelevance; label: string; hint: string }[] = [
  { value: "relevant", label: "Relevant", hint: "The program could be for them" },
  { value: "irrelevant", label: "Connector", hint: "Not for them — ask who they know" },
  { value: "unsure", label: "Unsure", hint: "Not categorised yet" },
];

// The aim for the list. Set by Don, 26 Jul 2026.
export const LIST_TARGET = 250;

export const statusLabel = (s: ContactStatus) =>
  STATUSES.find((x) => x.value === s)?.label ?? s;
export const mediumLabel = (m: ContactMedium) =>
  MEDIUMS.find((x) => x.value === m)?.label ?? "";
export const correspondenceLabel = (c: ContactCorrespondence) =>
  CORRESPONDENCES.find((x) => x.value === c)?.label ?? "";
export const relevanceLabel = (r: ContactRelevance) =>
  RELEVANCES.find((x) => x.value === r)?.label ?? r;

// --- CSV import normalisers -------------------------------------------------
// Real spreadsheets contain "Not Contacted", "not contacted", "NOT_CONTACTED"
// and "no reply yet". Map generously, and fall back to a safe default rather
// than rejecting the row — a rejected import is far more annoying than a value
// the client can correct in one click.

const squash = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");

export function normaliseStatus(raw: string): ContactStatus {
  const v = squash(raw);
  if (!v) return "not_contacted";
  if (["contacted", "sent", "messaged", "reachedout"].includes(v)) return "contacted";
  if (["replied", "responded", "reply"].includes(v)) return "replied";
  if (["interested", "keen", "warm", "callbooked", "booked"].includes(v))
    return "interested";
  if (["notinterested", "no", "declined", "lost", "nothanks"].includes(v))
    return "not_interested";
  if (["followuprequired", "followup", "tofollowup", "chase", "chasing"].includes(v))
    return "follow_up_required";
  if (["convertedtoclient", "converted", "client", "won", "signed", "closed", "paying"].includes(v))
    return "converted";
  return "not_contacted";
}

export function normaliseCorrespondence(raw: string): ContactCorrespondence {
  const v = squash(raw);
  if (!v) return "";
  if (["message1", "msg1", "first", "firstmessage", "initial"].includes(v)) return "message_1";
  if (["followup1", "fu1", "secondmessage", "second"].includes(v)) return "follow_up_1";
  if (["followup2", "fu2", "thirdmessage", "third"].includes(v)) return "follow_up_2";
  return "";
}

export function normaliseRelevance(raw: string): ContactRelevance {
  const v = squash(raw);
  if (!v) return "unsure";
  if (["relevant", "yes", "y", "possibleclient", "client", "lead"].includes(v))
    return "relevant";
  if (
    ["irrelevant", "notrelevant", "no", "n", "connector", "referrer", "introducer"].includes(v)
  )
    return "irrelevant";
  return "unsure";
}

export function normaliseMedium(raw: string): ContactMedium {
  const v = squash(raw);
  if (!v) return "";
  if (["facetoface", "f2f", "inperson", "meeting", "coffee"].includes(v)) return "face_to_face";
  if (["video", "videocall", "zoom", "teams", "facetime"].includes(v)) return "video";
  if (["voice", "phone", "call", "voicenote", "voicemessage", "phonecall"].includes(v))
    return "voice";
  if (["instantmessage", "im", "text", "sms", "whatsapp", "messenger", "message"].includes(v))
    return "instant_message";
  if (["dm", "directmessage", "linkedin", "instagram"].includes(v)) return "dm";
  if (["email", "mail", "e"].includes(v)) return "email";
  return "";
}

// Accepts ISO (2026-07-26), British (26/07/2026, 26-07-2026) and the short
// British form (26/07/26). Slash dates are read DAY FIRST — this is a British
// workspace and the UI says so next to the import control. Anything else
// becomes null rather than a wrong date.
export function normaliseDate(raw: string): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;

  const iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return toIso(+iso[1], +iso[2], +iso[3]);

  const brit = v.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2}|\d{4})$/);
  if (brit) {
    const year = brit[3].length === 2 ? 2000 + +brit[3] : +brit[3];
    return toIso(year, +brit[2], +brit[1]);
  }
  return null;
}

function toIso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  // Rejects 31 February and friends — Date rolls them over, so the round trip
  // catches it.
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

// Header cell -> our field name. Covers the spreadsheet's own headings and the
// obvious hand-made variants.
const HEADER_MAP: Record<string, string> = {
  name: "name",
  fullname: "name",
  contact: "name",
  contactname: "name",
  person: "name",
  email: "email",
  emailaddress: "email",
  mail: "email",
  phone: "phone",
  phonenumber: "phone",
  mobile: "phone",
  mobilenumber: "phone",
  tel: "phone",
  telephone: "phone",
  notes: "notes",
  note: "notes",
  comments: "notes",
  comment: "notes",
  status: "status",
  correspondence: "correspondence",
  message: "correspondence",
  stage: "correspondence",
  medium: "medium",
  channel: "medium",
  method: "medium",
  relevance: "relevance",
  relevant: "relevance",
  category: "relevance",
  firstcontactdate: "first_contact_date",
  firstcontact: "first_contact_date",
  firstcontacted: "first_contact_date",
  datefirstcontacted: "first_contact_date",
  lastcontactdate: "last_contact_date",
  lastcontact: "last_contact_date",
  lastcontacted: "last_contact_date",
  nextfollowup: "next_followup_date",
  nextfollowupdate: "next_followup_date",
  followup: "next_followup_date",
  followupdate: "next_followup_date",
  nextaction: "next_followup_date",
};

export function mapHeader(header: string): string | null {
  return HEADER_MAP[squash(header)] ?? null;
}
