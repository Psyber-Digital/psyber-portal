# Vimeo videos — Client Portal

Record of programme videos hosted on Vimeo (Asher Majeed's account, Starter plan).
Safe to store here: IDs/hashes only play when embedded on the whitelisted portal domain.
The API **access token is NOT stored in the repo** (kept in the session scratchpad only).

Privacy applied to every video: `view = disable` (hidden from Vimeo & search) +
`embed = whitelist` locked to `psyber-portal.vercel.app`.

| Session | Video ID | Private hash | Embed src | Status |
|---|---|---|---|---|
| Session 01 — Foundations (pre-work) | `1211864055` | `19c07e739e` | `https://player.vimeo.com/video/1211864055?h=19c07e739e` | Wired into portal (week 1). **Replace source with FINAL render**, then deploy. |
| Session 02 — Niche Ideas (pre-work) | `1212379930` | `c79b8e732c` | `https://player.vimeo.com/video/1212379930?h=c79b8e732c` | **Final render** (ElevenLabs Brian + on-cue animation, 7:36). Uploaded 23 Jul 2026; privacy `view=disable` + `embed=whitelist` (psyber-portal.vercel.app + portal.psyberdigital.com). Wired into portal (week 2). |

**Final render to upload (replace source, keep this ID):** `Projects/1-PsyberDigital/Programme/Session-1-Plan-and-Model-Shift/assets/video/Session-1-Prework-Video.mp4` (4:35, Brian voiceover + on-cue animation). Currently the Vimeo source is an earlier draft.

Sessions 02–09 + 2 bonus: to upload when produced. Vimeo can replace a video's source
file while keeping the same ID, so the DRAFT slot above stays stable when the final render lands.

## To embed in the real app (React)
```html
<iframe src="https://player.vimeo.com/video/1211864055?h=19c07e739e"
        width="100%" style="aspect-ratio:16/9;border:0"
        allow="fullscreen; picture-in-picture" allowfullscreen></iframe>
```
Will only play on the whitelisted domain(s). Add `portal.psyberdigital.com` to the whitelist
if/when a custom domain is set.
