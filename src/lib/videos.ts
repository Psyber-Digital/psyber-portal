// Vimeo video IDs per program week.
//
// The videos are PRIVATE + domain-locked on Vimeo (see ../../VIMEO-SETUP.md), so the id/hash
// sitting in the page source is safe — Vimeo will only play them when embedded on the allowed
// domain (psyber-portal.vercel.app). No API key or password ever goes here.
//
// To publish a week's video: upload it to Vimeo, set privacy to "Hide from Vimeo" + embed only
// on the portal domain, then add its id (and hash, if the private URL shows one) below.
//   e.g.  1: { id: "123456789", hash: "abcdef1234", title: "Session 1 · Pre-Work" }

export type WeekVideo = { id: string; hash?: string; title?: string };

export const WEEK_VIDEOS: Record<number, WeekVideo> = {
  // Session 1 pre-work. Same Vimeo ID is kept stable across re-uploads (replace the source
  // file on Vimeo to swap the draft for the final render). Recorded in ../../vimeo-videos.md.
  1: { id: "1211864055", hash: "19c07e739e", title: "Session 1 · Pre-Work" },
  // Session 2 pre-work (Niche — Ideas). Private + embed-whitelisted to the portal domain.
  2: { id: "1212379930", hash: "c79b8e732c", title: "Session 2 · Pre-Work" },
};

// The onboarding video, shown at the top of the portal home rather than as a week.
// It is not a session: no working sheet, nothing to complete. Same privacy as the
// rest — hidden on Vimeo, embeddable only on the portal domains.
export const WELCOME_VIDEO: WeekVideo | undefined = {
  id: "1214030618",
  title: "Welcome · Therapy+",
};

export function weekVideo(weekNumber: number): WeekVideo | undefined {
  return WEEK_VIDEOS[weekNumber];
}

export function welcomeVideo(): WeekVideo | undefined {
  return WELCOME_VIDEO;
}
