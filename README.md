# CREATAI — The Creative Intelligence OS

> Turn content, ads, creators and competitors into creative intelligence.
> Understand what works, why it works, and what to create next.

Single Next.js app deployed to Vercel. Supabase (auth + DB), OpenAI (analysis + chat). No separate backend server.

---

## What's built (V1)

| Module | Path | Status |
|---|---|---|
| Landing page | `/` | ✅ Cyberpunk HUD, dense |
| Auth (email + password) | `/login`, `/signup` | ✅ Supabase Auth |
| Dashboard | `/dashboard` | ✅ Live counts + recent activity |
| Brand Profile | `/brand` | ✅ Multi-brand CRUD |
| Analyze Content | `/analyze` | ✅ URL + manual entry |
| → YouTube auto-transcript | | ✅ Free via `youtube-transcript` |
| → Image URL → vision | | ✅ GPT-4o vision |
| → TikTok/IG/LinkedIn | | ⏳ Manual (V1.1: Apify) |
| Creative DNA generation | (API) | ✅ 22 attributes, 6 scores |
| Content Library | `/library`, `/library/[id]` | ✅ Filters + full DNA report |
| Competitors watchlist | `/competitors` | ✅ |
| Creators watchlist | `/creators` | ✅ |
| Creative Clusters | `/clusters` | ✅ LLM-based grouping |
| Trend Radar | `/trends` | ✅ Computed from saved data |
| AI Analyst chat | `/analyst` | ✅ Threaded, context-aware |
| Settings | `/settings` | ✅ |

21 routes total. Production build green.

---

## Setup on your Mac

You already have Node, git, and Xcode CLT installed.

### 1. Fill in `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL="https://djauuykxpbdtvkiiuikj.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon public from Supabase>"
SUPABASE_SERVICE_ROLE_KEY="<service_role from Supabase>"
OPENAI_API_KEY="<your new OpenAI key>"
```

Don't include `/rest/v1/` in the URL. Don't include line breaks in the keys.

### 2. Run the database migration

In your Supabase dashboard:
1. Open https://supabase.com/dashboard/project/djauuykxpbdtvkiiuikj/sql/new
2. Paste the contents of `supabase/migrations/001_creatai_v1_schema.sql`
3. Click **Run**

This creates 7 tables (brands, competitors, creators, content_assets, creative_dna_reports, creative_clusters, ai_chat_messages), enables Row-Level Security so each user only sees their own data, and creates a public `thumbnails` storage bucket.

### 3. Run locally

```bash
cd /Users/rohan/Downloads/creatai-v1
npm run dev
```

Open http://localhost:3000.

---

## Deployment (Vercel)

The app is designed to deploy as-is on Vercel:
1. Connect this repo to a Vercel project
2. In Vercel → Settings → Environment Variables, paste the same 4 values from `.env.local`
3. Vercel auto-detects Next.js and builds — no extra config needed

`/api/analyze` has `maxDuration = 60` set so the LLM call has time. If you need longer, upgrade to Pro.

---

## Architecture

```
src/
  app/
    page.tsx                            Landing
    layout.tsx + globals.css            Fonts + cyberpunk design tokens
    (auth)/                             Public auth routes
      login/                            /login
      signup/                           /signup
    (app)/                              Protected — requires session
      layout.tsx                        Sidebar + nav guard
      dashboard/                        Live KPIs + activity feed
      brand/                            Brand Profile CRUD
      analyze/                          Analyze form + extraction status
      library/                          Grid + filters
      library/[id]/                     Full DNA report
      competitors/                      Watchlist
      creators/                         Watchlist
      clusters/                         LLM grouping
      trends/                           Computed analytics
      analyst/                          AI chat
      settings/                         Operator account
    api/
      analyze/                          Generate DNA → save asset + report
      extract/                          URL → transcript/caption/thumbnail
      clusters/regenerate/              Re-run clustering
      analyst/chat/                     Chat completion with context
    auth/callback/, auth/signout/       Supabase Auth handlers
  components/
    ui/                                 Button, Card, Input, Label, Badge
    hud/                                HudDial, WireframeOrb, HexGrid,
                                        CircuitFrame, MicroLabels, SliderRack,
                                        TerrainView, DataReadout, MeterBar
    terminal-frame.tsx                  CRT-frame wrapper
    app-sidebar.tsx                     Left nav
    page-header.tsx                     Page heading + StatTile
    watchlist-form.tsx                  Shared competitor/creator form
  lib/
    supabase/client.ts                  Browser Supabase client
    supabase/server.ts                  Server + service-role clients
    supabase/middleware.ts              Auth-aware session refresh
    openai.ts                           OpenAI client + model config
    extract.ts                          YouTube/image/audio extraction
    dna.ts                              Creative DNA generation (JSON schema)
    types.ts                            Shared TypeScript types
    utils.ts                            cn() helper
middleware.ts                           Route protection
supabase/migrations/
  001_creatai_v1_schema.sql             Run this once in Supabase
```

---

## Tech stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**, **TypeScript**
- **Tailwind v4** — CSS-based theme tokens
- **Supabase** — auth + Postgres + RLS + storage
- **OpenAI** — `gpt-4o-mini` for analysis + chat, vision-enabled
- **youtube-transcript** — free YouTube transcript extraction
- **react-hook-form + zod** — forms + validation
- **lucide-react** — icons

---

## V1.1 roadmap (after launch)

- **Apify integration** — auto-extract TikTok/Instagram/LinkedIn captions + media
- **Whisper integration** — upload audio/video files for transcription
- **Embeddings + semantic search** — vector search across library
- **Multi-user team support** — share brands within an org
- **Public sharable DNA report links** — preview URL for prospects/clients
- **Brand voice fine-tuning** — let the AI Analyst learn your tone over time

---

## Useful commands

```bash
npm run dev        # dev server on :3000
npm run build      # production build
npm run start      # serve production build locally
npm run lint       # ESLint
```

---

Built with ☢️ by an unstoppable founder + an AI that ships.
