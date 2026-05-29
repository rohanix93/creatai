# CREATAI :: QUICKSTART (1-PAGER)

**Read this first. Then `CREATAI_HANDOFF.md` for full detail.**

---

## What it is

CREATAI — single Next.js app on Vercel that turns content (yours + competitors + creators) into Creative DNA reports + brand-level synthesis + AI Analyst chat. Apify scrapes, OpenAI analyzes, Supabase stores.

## Where it lives

| Thing | Where |
|---|---|
| Code | https://github.com/rohanix93/creatai |
| Live app | Vercel (auto-deploys on push to `main`) |
| Database / auth | Supabase project `djauuykxpbdtvkiiuikj` |
| AI | OpenAI (`gpt-4o-mini`) |
| Scraping | Apify |
| Local code | `/Users/rohan/Downloads/creatai-v1` |

## Critical blockers

🔴 **OpenAI account has no billing.** Every Generate Creative DNA / Brand DNA / AI Analyst call returns 429. **Fix:** add $10 prepay at https://platform.openai.com/account/billing. **App is feature-complete — this is the only blocker to full E2E.**

🟡 **LinkedIn single-post actor is flaky** (under maintenance, ~40% fail). Bulk profile actor is reliable (98% over 1M+ runs). Use bulk-profile for LinkedIn at scale.

🟡 **YouTube `youtube-transcript` npm fails on Vercel** by design — YouTube blocks cloud IPs. Routed through Apify instead. Don't try to "fix" the npm lib.

## To resume in a fresh account / machine

```bash
git clone https://github.com/rohanix93/creatai.git
cd creatai
npm install
# fill .env.local with 7 vars below (real values from each service's dashboard)
npm run dev
```

**Env vars needed (Vercel + `.env.local`):**
```
NEXT_PUBLIC_SUPABASE_URL          (Supabase Settings → API)
NEXT_PUBLIC_SUPABASE_ANON_KEY     (Supabase Settings → API, "anon public")
SUPABASE_SERVICE_ROLE_KEY         (Supabase Settings → API, "service_role secret")
OPENAI_API_KEY                    (create fresh at platform.openai.com/api-keys)
OPENAI_MODEL_ANALYSIS=gpt-4o-mini
OPENAI_MODEL_CHAT=gpt-4o-mini
APIFY_TOKEN                       (console.apify.com/account/integrations)
```

**⚠️ Never paste keys in chat.** Type them directly into `.env.local` and Vercel UI.

**Run migrations** (Supabase SQL Editor):
1. `supabase/migrations/001_creatai_v1_schema.sql` — core 7 tables + RLS
2. `supabase/migrations/002_brand_handles.sql` — adds handle columns
3. `supabase/migrations/003_brand_analyses.sql` — Brand DNA storage

## What's built (V1.0 → V1.3)

✅ Cyberpunk HUD design (scan-red primary, green = success)
✅ Signup / login (Supabase Auth, email confirmation OFF)
✅ Dashboard with live counts + recent activity
✅ Brand Profile (multi-brand, with audience/tone/USPs + 5 per-platform handles)
✅ Single-asset extraction: YouTube, Image vision, TikTok, IG, LinkedIn, Twitter (all via Apify or vision)
✅ Creative DNA report (22 attributes via OpenAI JSON-schema mode)
✅ Bulk profile scrape — "↓ pull last 20 posts" per competitor/creator/your-own-handle
✅ Content Library + filters + DNA detail page
✅ Watchlists for competitors + creators
✅ LLM-based Creative Clusters
✅ Trend Radar (computed analytics)
✅ AI Analyst chat (RAG-style context)
✅ **Brand DNA synthesis** (5-step: diagnose → pain → growth → aspiration → plan) at `/brand/[id]/dna`

## Roadmap (what's next)

**V1.4** — Competitor DNA + Creator DNA (reuse synthesis logic) + side-by-side comparison
**V1.5** — Weekly digest (scheduled cron) + audio file Whisper transcription
**V2** — Real OAuth, embeddings/semantic search, team support, public shareable reports

## Important context (don't undo)

- Python backend (`/Users/rohan/Downloads/creatai-backend-upload`) is **reference only** — abandoned. Don't deploy.
- Two GitHub accounts: `rohanix92` (old Lovable), `rohanix93` (V1, current). Vercel = rohanix93.
- Supabase URL is `https://djauuykxpbdtvkiiuikj.supabase.co` — **NO `/rest/v1/` suffix**.
- All Apify actor IDs are overridable via `APIFY_ACTOR_*` env vars without code changes.
- Operator is non-technical. Explain commands step by step.

## Files in this repo worth knowing

| File | Why |
|---|---|
| `CREATAI_HANDOFF.md` | Full 366-line context snapshot (read after this) |
| `README.md` | Phased build instructions |
| `src/lib/apify.ts` | Every scraping integration |
| `src/lib/dna.ts` | Single-asset Creative DNA generation |
| `src/lib/brand-dna.ts` | Brand-level synthesis (V1.3) |
| `src/lib/extract.ts` | URL → ExtractionResult dispatcher |
| `supabase/migrations/*.sql` | Schema in 3 files |

---

**Last updated:** 2026-05-28 after V1.3 ship. Latest commit on `main`: `1b2a357` (handoff doc) / `3acbe4e` (Brand DNA feature).
