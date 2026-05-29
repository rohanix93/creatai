# CREATAI :: HANDOFF / CONTEXT SNAPSHOT

**Generated:** 2026-05-28
**Project root:** `/Users/rohan/Downloads/creatai-v1`
**Status:** V1.3 shipped to production. Synthesis layer waiting on OpenAI billing to fully activate.

> Use this document to bootstrap a new Claude Code session from zero. Read top → bottom once; then you have the full picture.

---

## 0. TL;DR (read this first)

- **What:** CREATAI — "The Creative Intelligence OS." A single Next.js app deployed to Vercel that lets brands/creators/agencies pull content from any social platform, get structured Creative DNA reports, generate brand-level synthesis, and chat with an AI Analyst over the saved corpus.
- **Stack:** Next.js 16 · TypeScript · Tailwind v4 · Supabase (auth + Postgres + Storage) · OpenAI (gpt-4o-mini for analysis + chat) · Apify (scraping/extraction).
- **Live:** Deployed on Vercel under the GitHub account `rohanix93` (NOT `rohanix92` — they're two different accounts). Vercel auto-deploys on push to `main`.
- **Repo:** https://github.com/rohanix93/creatai
- **Supabase project ID:** `djauuykxpbdtvkiiuikj`
- **Critical blocker:** OpenAI account has no billing → every analysis call returns 429. App is fully built, just can't analyze until $10 is added at platform.openai.com/account/billing.
- **Reliability flag:** LinkedIn single-post actor (data-slayer/`HFElvVpoWmD1bD9A7`) is flaky (UNDER_MAINTENANCE, ~40% fail rate). Use the bulk-profile actor (`apimaestro/linkedin-profile-posts`, 98% success) for LinkedIn at scale.

---

## 1. Accounts & external services

| Service | Account / project | URL |
|---|---|---|
| GitHub (V1 repo) | **rohanix93** | https://github.com/rohanix93/creatai |
| GitHub (Lovable repo, to be archived) | rohanix92 | https://github.com/rohanix92/creative-intelligence-os |
| GitHub (broken Codex backend, to be archived) | rohanix93 | https://github.com/rohanix93/creatai-backend |
| Vercel | bound to rohanix93 GitHub | https://vercel.com/dashboard |
| Supabase | project `djauuykxpbdtvkiiuikj` | https://supabase.com/dashboard/project/djauuykxpbdtvkiiuikj |
| OpenAI | the operator's account | https://platform.openai.com |
| Apify | the operator's account | https://console.apify.com |

---

## 2. Critical context (decisions / why)

1. **Python backend was abandoned.** Originally the plan was Lovable frontend + Codex-generated Python FastAPI backend on Render. The Python folder uploaded to GitHub flat (no subfolders) and broke deploys. We pivoted to a single Next.js app — Supabase + OpenAI + Apify directly. Old code at `/Users/rohan/Downloads/creatai-backend-upload` is **reference only**, do not deploy.
2. **Lovable repo replaced.** `rohanix92/creative-intelligence-os` was the Lovable export. Replaced by `rohanix93/creatai`. Archive the old repo when comfortable.
3. **No OAuth integration with platforms.** Real OAuth (Meta, TikTok, LinkedIn, YouTube) requires platform developer accounts + app review. We use **Apify** instead — pay-as-you-go scraping that handles auth on its side. Trade-off: $0.001-0.05 per scrape, no platform partnerships needed.
4. **Color palette:** scan-red is the primary brand color. Green is reserved for SUCCESS / LIVE / ONLINE indicators only. Purple/blue are secondary accents. Original Lovable spec mentioned green/purple/blue but the operator's reference imagery (cyberpunk HUD) was red-dominant, and we flipped to match.
5. **Operator is non-technical.** Always explain every command, walk through deploys step by step, never paste secrets to chat. The operator has accidentally pasted their OpenAI key 3× — be vigilant about not echoing keys back.

---

## 3. Live deployment state

**Last shipped commits (push to `main` triggers Vercel auto-deploy):**

| Commit | Title |
|---|---|
| `3acbe4e` | feat(v1.3): Brand DNA — 5-step synthesis report |
| `4194bda` | feat(v1.2): bulk profile scrape across all 5 platforms |
| `f381ac5` | feat(apify): emit metrics for all 5 platforms |
| `a78b02a` | fix(apify): correct input field names per each actor's schema |
| `5d00d72` | fix(apify-linkedin): defensive normalizer with longest-text fallback |
| `c7ea5d9` | fix(apify): correct LinkedIn extraction + actor env overrides |
| `5064b3b` | fix: route YouTube extraction through Apify |
| `ad63d62` | feat: Apify integration for TikTok / IG / LinkedIn / Twitter |
| `a649dbd` | docs: full V1 README |
| `e445867` | CREATAI V1: complete app |

Verify live deploy via Vercel dashboard → Deployments → top row should match the latest commit on `main`.

---

## 4. Environment variables (Vercel + local `.env.local`)

**Required** (set in Vercel → Settings → Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL          https://djauuykxpbdtvkiiuikj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     <anon public key from Supabase API settings>
SUPABASE_SERVICE_ROLE_KEY         <service_role secret from Supabase API settings>
OPENAI_API_KEY                    <new sk-proj-... created at platform.openai.com>
OPENAI_MODEL_ANALYSIS             gpt-4o-mini
OPENAI_MODEL_CHAT                 gpt-4o-mini
APIFY_TOKEN                       <from console.apify.com/account/integrations>
```

**Optional actor overrides** (only set if defaults misbehave):

```
APIFY_ACTOR_LINKEDIN              HFElvVpoWmD1bD9A7   (single-post; flaky)
APIFY_ACTOR_LINKEDIN_PROFILE      apimaestro/linkedin-profile-posts   (98% reliable)
APIFY_ACTOR_TIKTOK                clockworks/free-tiktok-scraper
APIFY_ACTOR_TIKTOK_PROFILE        clockworks/free-tiktok-scraper
APIFY_ACTOR_INSTAGRAM             apify/instagram-scraper
APIFY_ACTOR_INSTAGRAM_PROFILE     apify/instagram-scraper
APIFY_ACTOR_YOUTUBE               streamers/youtube-scraper
APIFY_ACTOR_YOUTUBE_PROFILE       streamers/youtube-scraper
APIFY_ACTOR_TWITTER               apidojo/tweet-scraper
APIFY_ACTOR_TWITTER_PROFILE       apidojo/tweet-scraper
```

**⚠️ Never paste keys into chat.** Always type them directly into Vercel/the local `.env.local`.

---

## 5. Supabase schema (all migrations to apply in order)

All migration SQL files are at `/Users/rohan/Downloads/creatai-v1/supabase/migrations/`. Run in order:

1. **`001_creatai_v1_schema.sql`** — Core V1 schema: 7 tables (`brands`, `competitors`, `creators`, `content_assets`, `creative_dna_reports`, `creative_clusters`, `ai_chat_messages`), RLS scoped to `auth.uid() = owner_id`, `thumbnails` storage bucket, `updated_at` triggers.
2. **`002_brand_handles.sql`** — Adds 5 handle columns to `brands`: `handle_instagram`, `handle_tiktok`, `handle_youtube`, `handle_linkedin`, `handle_twitter`.
3. **`003_brand_analyses.sql`** — `brand_analyses` table for Brand DNA synthesis reports (V1.3).

To apply: paste each file's contents into Supabase SQL Editor → Run. The first migration drops old V1 tables AND legacy Codex tables, then recreates everything. The other two are additive (`alter ... add column if not exists`).

**Tables you should see after all 3 migrations:** `brands`, `competitors`, `creators`, `content_assets`, `creative_dna_reports`, `creative_clusters`, `ai_chat_messages`, `brand_analyses` (8 total).

**Also in Supabase Auth:**
- Confirm email: turned OFF (for V1 fast signup → instant login)
- Site URL: should match your Vercel domain (so password reset links work)
- Redirect URLs: include `https://<your-vercel>.vercel.app/**`

---

## 6. Architecture map (file structure)

```
src/
  app/
    page.tsx                          Landing page (cyberpunk HUD with terrain view, dials, etc.)
    layout.tsx + globals.css          Design system tokens, fonts (VT323, JetBrains Mono, Inter)
    (auth)/
      login/                          Supabase email+password sign-in
      signup/                         Sign up
    (app)/                            Protected — auth check in layout
      layout.tsx                      Sidebar shell
      dashboard/                      Live KPIs + recent activity feed
      brand/
        page.tsx                      Multi-brand list + edit form
        [id]/dna/                     V1.3 — Brand DNA synthesis report page
      analyze/                        Single-asset Creative DNA flow
      library/
        page.tsx                      Grid of all assets, filters
        [id]/                         Full DNA report detail
      competitors/                    Watchlist + "▶ Pull posts" bulk scrape
      creators/                       Watchlist + "▶ Pull posts" bulk scrape
      clusters/                       LLM-grouped creative families
      trends/                         Aggregated analytics over saved DNA
      analyst/                        Chat with AI Analyst (RAG-style context from your assets)
      settings/                       Operator account
    api/
      analyze/                        POST: generate Creative DNA for one asset
      extract/                        POST: single-URL extract (YouTube, image, or Apify dispatch)
      extract/profile/                POST: bulk scrape a creator's last N posts (V1.2)
      analyst/chat/                   Chat completion with brand+DNA context
      clusters/regenerate/            Re-run LLM clustering over user's data
      brand/[id]/analyze/             POST: synthesize Brand DNA (V1.3)
      auth/callback/, auth/signout/
  components/
    ui/                               Button, Card, Input, Label, Badge primitives
    hud/                              HudDial, WireframeOrb, HexGrid, CircuitFrame,
                                      MicroLabels, SliderRack, TerrainView,
                                      DataReadout, MeterBar
    terminal-frame.tsx                CRT-frame wrapper for panels
    app-sidebar.tsx                   Left nav with all 10 modules
    page-header.tsx                   Page heading + StatTile
    watchlist-form.tsx                Shared competitor/creator form
    scrape-profile-button.tsx         V1.2 — bulk profile scrape trigger
  lib/
    supabase/
      client.ts                       Browser client (anon key)
      server.ts                       Server client + service-role helper
      middleware.ts                   Auth-aware session refresh
    openai.ts                         OpenAI SDK init + MODELS config
    extract.ts                        URL → ExtractionResult dispatcher
                                      (YouTube → Apify; image → vision; other → Apify by platform)
    apify.ts                          All Apify integrations:
                                        scrapeViaApify       (single-URL dispatch)
                                        scrapeProfile        (bulk-profile dispatch)
                                        scrapeYouTube/TikTok/Instagram/LinkedIn/Twitter
                                        scrape*Profile counterparts
                                        ACTORS + PROFILE_ACTORS maps
    dna.ts                            Single-asset Creative DNA generation (22 attributes via JSON schema)
    brand-dna.ts                      V1.3 — brand-level synthesis (5-step structured output)
    types.ts                          Shared TypeScript types
    utils.ts                          cn() helper

middleware.ts                         Next.js middleware → route protection
supabase/migrations/                  001, 002, 003 SQL files

.env.local                            Local dev env (git-ignored)
.env.example                          Template
package.json / package-lock.json
next.config.ts / tsconfig.json
tailwind config — CSS-based in globals.css (Tailwind v4)
```

---

## 7. Features built (categorized)

### Phase 1 — Foundation
- Next.js 16 + Tailwind v4 project scaffold
- Cyberpunk HUD design language (VT323 display, JetBrains Mono, Inter; scan-red primary; green-for-success)
- Reusable HUD primitives library (dials, orbs, hex grid, circuit decoration, terrain view, micro-labels, meters)
- Supabase Auth (email + password), session middleware, route protection
- Sidebar shell with 10 navigable modules
- Landing page with terrain viewport, multiple dials, satellite widgets
- Dashboard with live counts, opportunity score, intel feed, next-actions queue

### Phase 2 — Single-asset flow
- Brand Profile CRUD (multi-brand, audience/tone/USPs context)
- Competitor watchlist + Creator watchlist
- Analyze Content form with auto-extraction:
  - **YouTube** → Apify scraper (npm `youtube-transcript` fails on Vercel due to IP blocks — important!)
  - **Image URLs** → GPT-4o vision describes the image
  - **TikTok / IG / LinkedIn / Twitter** → Apify per-platform actors
  - Manual paste fallback for everything
- Creative DNA generation (single asset, 22 attributes via OpenAI JSON-schema mode)

### Phase 3 — Library & filters
- Library grid view with filter chips (platform, family, emotion, min score)
- Full DNA report detail page (`/library/[id]`) — scores, attributes, narrative, ideas, raw caption/transcript

### Phase 4 — Intelligence layer
- Creative Clusters — LLM groups your saved DNA reports into creative families
- Trend Radar — computed analytics over saved data
- AI Analyst — chat with context loaded from brand + DNA reports

### V1.1 — Apify integration
- Single-URL extraction now works for TikTok, Instagram, LinkedIn, Twitter, YouTube
- Metrics auto-populate (likes, comments, shares, views, saves) for all 5 platforms

### V1.2 — Bulk profile scrape
- `scrapeProfile()` lib function dispatches to per-platform bulk-friendly actors
- New POST `/api/extract/profile` route
- "▶ Pull posts" buttons on Competitor/Creator cards
- Brand profile gets 5 per-platform handle fields + per-handle "↓ pull" buttons
- Imports posts directly into Library, tagged with source entity

### V1.3 — Brand DNA synthesis
- New `brand_analyses` table
- `generateBrandDna()` produces 5-step structured report inspired by Blowup's onboarding funnel:
  1. **Diagnose** — niche, summary, audience tags, strengths, areas to improve
  2. **Pain** — up to 3 underperforming posts with reasons
  3. **Growth** — virality score (0-100), 30-day growth curve, multiplier
  4. **Aspiration** — target followers + target date 6-12mo out
  5. **Plan** — recommended hooks, content ideas, posting cadence
- Full HUD-styled report at `/brand/[id]/dna`

---

## 8. Known issues / blockers / gotchas

### 🔴 BLOCKERS

1. **OpenAI billing not set up.** Every analysis API call (Creative DNA, Brand DNA, AI Analyst, Clusters) returns 429 until $10 prepay or usage billing is enabled at platform.openai.com/account/billing. The app is functionally complete — this is the only thing standing between you and end-to-end working flows.

### 🟡 RELIABILITY ISSUES

2. **LinkedIn single-post actor is flaky.** `data-slayer/linkedin-post-analytics-scraper` (`HFElvVpoWmD1bD9A7`) shows UNDER_MAINTENANCE and has ~40% fail rate. Posts marked private/restricted by LinkedIn return "THIS POST CANNOT BE DISPLAYED" envelope. We handle this case gracefully — surface as a "post is restricted" message, ask user to paste manually.
3. **LinkedIn bulk profile actor is reliable.** `apimaestro/linkedin-profile-posts` has 98% success over 1M+ runs in last 30 days. **Prefer bulk profile scrape over single-post for LinkedIn.**
4. **YouTube blocks Vercel IPs.** The `youtube-transcript` npm library fails on Vercel because YouTube blocks cloud-provider IP ranges. We route YouTube through Apify (`streamers/youtube-scraper`) which uses residential proxies. Don't try to "fix" the npm library — the architecture is intentional.

### ⚠️ GOTCHAS

5. **Two GitHub accounts.** `rohanix92` (original Lovable) and `rohanix93` (current V1 repo). Vercel is bound to `rohanix93`. Don't push to the wrong one.
6. **Supabase URL format.** Must be `https://djauuykxpbdtvkiiuikj.supabase.co` — NOT with trailing `/rest/v1/`. The Supabase client appends paths itself.
7. **Operator's `.env.local` keeps regenerating with placeholder text** (`<paste anon public>`) and a leaked OpenAI key shows up in chat context via system-reminders. **Never echo keys back; never read `.env.local` unprompted.**
8. **Tailwind v4 uses CSS-based theme tokens.** All custom colors defined via `@theme inline { --color-* }` in `globals.css`. No `tailwind.config.ts`.

---

## 9. Apify actor inventory

Single-post URL extraction:

| Platform | Default actor | Input field |
|---|---|---|
| TikTok | `clockworks/free-tiktok-scraper` | `postURLs` (array) |
| Instagram | `apify/instagram-scraper` | `directUrls` + `resultsType: "posts"` |
| LinkedIn | `HFElvVpoWmD1bD9A7` (data-slayer) | `linkedin_url` (string) — singular! |
| Twitter / X | `apidojo/tweet-scraper` | `startUrls` (array) |
| YouTube | `streamers/youtube-scraper` | `startUrls` (array of {url}) |

Bulk profile scrape:

| Platform | Default actor | Input field |
|---|---|---|
| TikTok | `clockworks/free-tiktok-scraper` | `profiles` (array of usernames) |
| Instagram | `apify/instagram-scraper` | `directUrls` (profile URL) + `resultsType: "posts"` |
| LinkedIn | `apimaestro/linkedin-profile-posts` | `username` (string) + `total_posts` |
| Twitter / X | `apidojo/tweet-scraper` | `twitterHandles` (array) |
| YouTube | `streamers/youtube-scraper` | `startUrls` (channel URL) |

All overridable via `APIFY_ACTOR_*` and `APIFY_ACTOR_*_PROFILE` env vars in Vercel.

---

## 10. Roadmap (what's next)

### V1.4 (immediate next session)
- **Competitor DNA** — same synthesis as Brand DNA but pointed at a competitor's pulled content. Reuse `brand-dna.ts` logic, point at competitor.
- **Creator DNA** — same for creators.
- **Side-by-side DNA comparison** — pick N assets or N entities, see attribute matrix diff. Major agency/brand-side selling point.

### V1.5
- **Weekly digest** — scheduled cron (Vercel Pro) that re-runs Brand DNA, emails operator the diff vs last week.
- **Audio file upload + Whisper** — for video files that lack public URLs.

### V2
- Real OAuth integrations (TikTok Display API, Instagram Graph API) if there's appetite — major engineering investment.
- Embeddings + semantic search across the Library.
- Multi-user team support (share brands within an org).
- Public shareable DNA reports (preview-mode for prospects/clients).

---

## 11. How to resume in a new account / session

If picking this up in a fresh Claude Code session or a different machine:

1. **Clone the repo:** `git clone https://github.com/rohanix93/creatai.git && cd creatai`
2. **Install deps:** `npm install`
3. **Create `.env.local`** with the 7 required env vars from section 4 (real values from Supabase + OpenAI + Apify dashboards)
4. **Run migrations:** Paste each `supabase/migrations/00*.sql` into Supabase SQL Editor, in order
5. **Run dev server:** `npm run dev` → open http://localhost:3000
6. **Sanity check:**
   - Sign up at `/signup` (Supabase email confirmation should be OFF)
   - Should land on `/dashboard`
   - Hit `/brand` to create a brand profile
   - Try a YouTube URL on `/analyze` (cheapest validation)
   - If `Generate Creative DNA` returns 429 → fix OpenAI billing
7. **Deploy:** Push to `rohanix93/creatai` → Vercel auto-deploys
8. **Read this file once. Don't try to re-engineer decisions in section 2.**

---

## 12. AI assistant notes (Claude-specific tips for resuming)

If resuming this build with Claude:

- The operator is non-technical. Always show step-by-step instructions for terminal commands and dashboard clicks.
- They have accidentally pasted their OpenAI API key in chat 3 times. Be vigilant — don't echo keys back, don't read `.env.local` unless asked, warn them when keys leak via system-reminders.
- Two GitHub accounts (`rohanix92`, `rohanix93`). Vercel is on `rohanix93`. Don't suggest pushing to the wrong one.
- Chrome MCP works for Supabase and (sometimes) Vercel; **does not work for GitHub** (domain blocked).
- The Python backend at `/Users/rohan/Downloads/creatai-backend-upload` is reference-only — DO NOT propose using it.
- Brand color is scan-red (`#ff4d4d`). Green (`#00ff9d`) is reserved for SUCCESS / LIVE indicators.
- When the operator says "still not working" — ASK what specifically (extract / analyze / deploy / login) before assuming.
- Always pass commit hashes back to the operator when relevant ("after Vercel deploys commit `xxxxxxx`...") so they can verify in their dashboard.

---

## 13. Quick reference — key URLs

| Need | URL |
|---|---|
| GitHub repo | https://github.com/rohanix93/creatai |
| Supabase dashboard | https://supabase.com/dashboard/project/djauuykxpbdtvkiiuikj |
| Supabase SQL Editor | https://supabase.com/dashboard/project/djauuykxpbdtvkiiuikj/sql/new |
| Supabase Auth settings | https://supabase.com/dashboard/project/djauuykxpbdtvkiiuikj/auth/providers |
| OpenAI billing | https://platform.openai.com/account/billing |
| OpenAI API keys | https://platform.openai.com/api-keys |
| Apify console | https://console.apify.com |
| Apify integrations / token | https://console.apify.com/account/integrations |
| Vercel dashboard | https://vercel.com/dashboard |
| GitHub PAT settings | https://github.com/settings/tokens?type=beta |

---

**End of handoff. Treat this file as the source of truth when context is fragmented. Last updated by Claude after V1.3 ship.**
