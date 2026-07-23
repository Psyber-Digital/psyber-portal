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
};

export function weekVideo(weekNumber: number): WeekVideo | undefined {
  return WEEK_VIDEOS[weekNumber];
}
