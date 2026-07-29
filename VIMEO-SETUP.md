# Vimeo Setup — Client Portal videos

For the 9 session videos + 2 bonus videos (11 total). Goal: private, premium, domain-locked
video hosting embedded in the portal. All steps are in the Vimeo website (browser), not the terminal.

---

## Before you start — what "done" looks like
Each video: uploaded, set so it can't be found on vimeo.com or Google, and can only play when
embedded on your portal's own domain. At the end you send Claude the 11 video IDs; Claude wires
them into the portal. No password or API key ever goes into the code.

---

## Step 1 — Create the account
1. Go to **vimeo.com** → **Join / Sign up** (top right).
2. Sign up with your Psyber email (`asher@psyberdigital.com`).
3. Verify the email if it asks.
**Success:** you're logged in and see an empty video library / "Home".

## Step 2 — Choose the plan
1. Go to **vimeo.com/upgrade** (or Settings → Plans).
2. You need the cheapest paid tier that includes **all three** of these — confirm on the page,
   because Vimeo renames tiers and changes prices:
   - Private / unlisted videos (hide from Vimeo).
   - **"Hide from Vimeo"** privacy option.
   - **Embed only on domains you choose** (domain-level privacy). ← the important one.
3. Historically this is the **"Standard"** tier (was "Plus/Pro"). Pick monthly first; switch to
   annual later if you're happy.
**Do NOT** pick the free plan — it lacks domain-locking and shows Vimeo branding.
**Success:** your account shows the paid plan active.
**Note:** don't take my word on the exact price — read it off the pricing page before paying.

## Step 3 — Make a folder for the programme
1. In your library, left sidebar → **New → Folder** (or "Project").
2. Name it **"Client Portal — Programme"**.
This keeps the 11 videos together and away from anything else.
**Success:** an empty folder with that name.

## Step 4 — Upload the first video
1. Open the folder → **New video → Upload**.
2. Drag in the video file (e.g. the Session 1 pre-work video once final).
3. Wait for "Uploading" → "Processing" to finish (a few minutes for a 10-min HD video).
**Success:** the video appears with a thumbnail and plays inside Vimeo.

## Step 5 — Set the privacy (do this for every video)
Open the video → **Settings** (or the pencil / gear) → **Privacy** tab. Set:
1. **Who can watch** → **"Hide from Vimeo"** (also called "Unlisted/Private"). Not "Only me".
2. **Where can this be embedded** → **"Specific domains"** → add:
   - `psyber-portal.vercel.app`
   - your final custom domain if/when you add one (e.g. `portal.psyberdigital.com`).
3. Turn **OFF** any "Allow this to appear in Google/search" toggle if present.
4. (Optional) Under embed appearance, hide the Vimeo logo, title bar and "share" buttons for a
   clean, in-portal feel.
**Success:** opening the video's public vimeo.com URL directly shows "This video is private",
but it will play once embedded on the portal.

## Step 6 — (Optional) Polish per video
- **Thumbnail:** upload a custom poster frame or pick a nicer frame.
- **Chapters:** add chapter markers (e.g. Lens Flip, Four Pillars) — nice for a 10-min video.
- **Captions:** upload or auto-generate captions (accessibility + people watching muted).

## Step 7 — Repeat for all 11
Upload the other 8 sessions + 2 bonus videos the same way (Steps 4–5). Name them clearly, e.g.
`Session 01 — Foundations`, `Session 02 — Patterns`, … `Bonus 01 — …`. Consistent names make
wiring them up painless.

## Step 8 — Send Claude what's needed
For each video Claude needs its **ID** (the number in the URL). To find it:
- Open the video in Vimeo → the URL looks like `vimeo.com/`**`123456789`** → that number is the ID.
- (If a video is set to private with an unlisted hash, the URL may look like
  `vimeo.com/123456789/`**`abcdef1234`** — send **both** parts.)

Send Claude a simple list, e.g.:
```
Session 01 — Foundations : 123456789 (hash: abcdef1234)
Session 02 — Patterns    : 234567890 (hash: …)
Bonus 01 — …             : 345678901 (hash: …)
```
Claude then embeds them in the portal (mockup + real app). Because the videos are domain-locked,
the ID/hash being in the page source is safe — they still only play on your portal.

---

## What this costs you (roughly)
One flat monthly/annual Vimeo subscription. 11 short videos is a tiny fraction of any paid tier's
storage, so you won't hit limits or usage fees. Confirm the exact figure on the pricing page.

## Why Vimeo over the alternatives (for the record)
- **Cloudflare Stream** — a few pounds cheaper, but no polished library UI and more technical
  setup (signed tokens). Not worth the friction for one practitioner.
- **Mux** — developer-grade analytics, pricier, overkill for 11 videos.
- **YouTube unlisted** — free, but off-brand, shows related videos/ads risk, and not truly private.
Vimeo wins on simplicity + premium feel + real domain-locked privacy.
