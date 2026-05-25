# CREATAI — The Creative Intelligence OS

> Turn content, ads, creators and competitors into creative intelligence.
> Understand what works, why it works, and what to create next.

This is the V1 of CREATAI — a single Next.js app deployed to Vercel, using Supabase for auth + database and OpenAI for AI analysis. **No separate backend server, no Python, no Render.**

---

## Status

| Phase | What | Status |
|---|---|---|
| 1 | Project shell — landing, auth, dashboard, cyberpunk UI | ✅ Done |
| 2 | Brand Profile + Analyze Content + Creative DNA generator | ⏳ Next |
| 3 | Save reports to Supabase + Content Library + filters | ⏳ |
| 4 | Creative Clusters + Trend Radar + AI Analyst chat | ⏳ |
| 5 | Polish, demo data, Vercel deploy | ⏳ |

---

## 1. Run it on your Mac (5-minute setup)

You already have Node.js and git installed. Now:

### A. Get your Supabase keys

1. Open https://supabase.com/dashboard/project/djauuykxpbdtvkiiuikj/settings/api
2. You'll see **Project URL** and two **API Keys**.
3. Keep this tab open — you'll paste from it.

### B. Get your OpenAI key

1. Open https://platform.openai.com/api-keys
2. Click **Create new secret key**, name it `creatai-local`.
3. Copy it once (you can't see it again) and keep it for the next step.

### C. Fill in `.env.local`

Open the file `.env.local` in this project (it already exists, empty). Paste the four values:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://djauuykxpbdtvkiiuikj.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="paste anon public key from Supabase"
SUPABASE_SERVICE_ROLE_KEY="paste service_role secret from Supabase"
OPENAI_API_KEY="paste the key you just created"
```

> ⚠️ Never share, screenshot, or commit `.env.local`. It's already in `.gitignore`.

### D. Start the dev server

Open Terminal, navigate to this folder, run:

```bash
cd /Users/rohan/Downloads/creatai-v1
npm run dev
```

Then open **http://localhost:3000** in your browser.

You should see the **CREATAI landing page** in retro cyberpunk style.

### E. Try it

1. Click **Start analyzing** → fills in `/signup`
2. Create an account (any email + 8-char password)
3. If Supabase requires email confirmation, check your inbox for the link
4. You'll land on **/dashboard** with the full sidebar nav
5. Most modules say "Phase 2/3/4" — that's expected for V1.0

---

## 2. What's actually built

```
src/
  app/
    page.tsx                     ← Landing page
    layout.tsx                   ← Fonts + global theme
    globals.css                  ← Cyberpunk design tokens
    (auth)/
      login/page.tsx             ← /login
      signup/page.tsx            ← /signup
    (app)/                       ← Protected, requires login
      layout.tsx                 ← Sidebar shell
      dashboard/page.tsx         ← Command center
      brand/                     ← Phase 2 stub
      analyze/                   ← Phase 2 stub
      library/                   ← Phase 3 stub
      competitors/               ← Phase 2 stub
      creators/                  ← Phase 2 stub
      clusters/                  ← Phase 4 stub
      trends/                    ← Phase 4 stub
      analyst/                   ← Phase 4 stub
      settings/page.tsx          ← Working settings page
    auth/callback/route.ts       ← Email confirmation handler
    auth/signout/route.ts        ← Sign-out endpoint
  components/
    ui/                          ← Button, Card, Input, Label, Badge
    terminal-frame.tsx           ← Reusable CRT-frame
    app-sidebar.tsx              ← Retro left nav
    page-header.tsx              ← Page heading + StatTile
    phase-placeholder.tsx        ← Coming-soon screen
  lib/
    utils.ts                     ← cn() classname helper
    supabase/
      client.ts                  ← Browser Supabase client
      server.ts                  ← Server / service-role clients
      middleware.ts              ← Auth-aware route protection
middleware.ts                    ← Next.js middleware entry
```

---

## 3. What you'll do once V1 is fully built

- Deploy to Vercel (one click, connect GitHub repo)
- Delete the old `creatai-backend` repo on GitHub
- Delete or archive `creative-intelligence-os` (the Lovable repo) — we replaced it
- Cancel Render / Upstash Redis — not used anymore

---

## 4. Tech stack

- **Next.js 16** (App Router) — React framework
- **TypeScript** — type safety
- **Tailwind v4** — styling
- **Supabase** — auth + Postgres database
- **OpenAI SDK** — Creative DNA + AI Analyst
- **react-hook-form + zod** — forms + validation
- **lucide-react** — icons

---

## 5. Useful commands

```bash
npm run dev        # local dev server with hot reload (port 3000)
npm run build      # production build (catches errors before deploy)
npm run start      # runs the production build locally
npm run lint       # check for linting issues
```

---

## 6. Troubleshooting

**Page is blank / "Application error":** Open browser DevTools → Console. Most often it's a missing or wrong env var. Re-check `.env.local` matches the keys in Supabase.

**"Invalid login credentials":** Sign up first at `/signup`. If you signed up but never confirmed via email, check Supabase → Authentication → Users — the user should show up. You can manually confirm in the dashboard if needed.

**Cannot find module `@/...`:** Restart the dev server. Path aliases sometimes need a fresh start.

**Pre-commit / git issues:** Not configured yet. We'll add them in Phase 5.

---

Built with ☢️ by an unstoppable founder + an AI that takes notes.
