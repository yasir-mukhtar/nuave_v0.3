# CLAUDE.md — Nuave Project Context

> Last updated: March 9, 2026

## What is Nuave?

**Nuave** (nuave.ai) — AEO (Answer Engine Optimization) SaaS for Indonesian/Malaysian SMBs.
Measures how often AI tools mention a brand, delivers a 0–100 Visibility Score, generates content fixes.
Credits-based (not subscription). 10 free credits on signup. IDR pricing via Midtrans.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router (TypeScript) |
| Styling | Tailwind CSS 4 + `src/app/globals.css` + `src/styles/tokens.css` |
| Components | shadcn/ui — **new screens only**, never retrofit existing |
| Fonts | Geist (headings) + Inter (body) |
| Icons | `@tabler/icons-react` — `size={18}` `stroke={1.5}` |
| Database | Supabase PostgreSQL — Singapore (sin1) |
| Auth | Supabase Auth — Google OAuth only |
| AI — Scraping & Recs | Anthropic **`claude-sonnet-4-5-20250929`** (exact string required) |
| AI — Audit | OpenAI GPT-4o with `web_search` tool |
| Payments | Midtrans (Indonesian payment methods) |
| Hosting | Vercel — auto-deploy from `main` |
| Repo | github.com/yasir-mukhtar/nuave_v0.3 |

---

## File Structure

```
src/
├── app/
│   ├── (dashboard)/        # Route group with sidebar layout — dashboard, prompt, content, brand pages
│   ├── api/                # scrape, generate-prompts, run-audit, audit/[id]/status, recommendations, user/credits, support
│   ├── audit/[id]/         # running, results, recommendations screens
│   ├── auth/               # Login page + OAuth callback (creates user + 10 credits)
│   ├── onboarding/         # analyze, profile, prompts screens
│   ├── harga/              # Public pricing page
│   ├── privacy/            # Privacy policy
│   ├── terms/              # Terms of service
│   ├── support/            # Contact form (sends email via Resend)
│   ├── globals.css         # Design tokens + component classes
│   └── page.tsx            # Landing page (Bahasa Indonesia)
├── components/             # Sidebar, Topbar, Footer, PromptDetailModal, dashboard panels
├── hooks/                  # useActiveWorkspace, useCreditsBalance
├── lib/supabase/
│   ├── server.ts           # createSupabaseServerClient() + createSupabaseAdminClient()
│   └── client.ts           # createSupabaseBrowserClient()
├── middleware.ts           # Auth middleware (MUST be in src/, not project root)
└── styles/tokens.css       # CSS design tokens
```

---

## Critical Rules

1. **Middleware location:** `src/middleware.ts` — Next.js ignores it at project root when using `src/` directory
2. **Supabase SSR cookies:** `getAll`/`setAll` (v0.9+). Old `get`/`set`/`remove` silently fails
3. **Auth checks:** Always `getUser()`, never `getSession()` — `getUser()` server-verifies, `getSession()` can be stale
4. **Browser Supabase:** Use `createSupabaseBrowserClient()`, not `createClient()` directly
5. **Admin client:** `createSupabaseAdminClient()` in `server.ts` — no separate `admin.ts`
6. **Pre-generate UUIDs:** `randomUUID()` before INSERT, never SELECT after INSERT (avoids PGRST204)
7. **Anthropic model:** Always `claude-sonnet-4-5-20250929` — without date suffix causes billing errors
8. **OpenAI calls:** Sequential with 500ms delay. Never `Promise.all()`
9. **Next.js 16 params:** Dynamic route params must be awaited: `const { id } = await params;`
10. **After schema changes:** Run `NOTIFY pgrst, 'reload schema';` in Supabase SQL editor
11. **UI language:** All user-facing strings in Bahasa Indonesia
12. **Sidebar layout:** `.sidebar` must be sibling of `.main`, never nested

---

## Auth & Route Protection

**Protected routes:** `/dashboard`, `/onboarding`, `/prompt`, `/content`, `/brand`
Unauthenticated → redirect to `/auth?next=<path>`

**Onboarding flow:**
1. Landing form → save brand/url to `sessionStorage` → redirect to `/auth`
2. OAuth callback → create `users` row (10 credits) + `credit_transactions` bonus
3. Redirect to `/onboarding/analyze` → reads sessionStorage → auto-scrape

---

## AI Architecture

- **Claude** (`claude-sonnet-4-5-20250929`): website scraping, profile generation, recommendations
- **GPT-4o** with `web_search`: simulates real user queries for audit
- **Background audit:** `/api/run-audit` → `waitUntil()` → client polls `/api/audit/[id]/status` every 3s
- **Prompts:** Never include brand name. 3 awareness + 4 consideration + 3 decision. 3/10 in Bahasa Indonesia
- **Stale audit reaper:** Audits running >10min auto-marked `failed` during polling

## Recommendations

Two-step freemium: free titles on page load (cached in Supabase), paid reveal (1 credit) for `suggested_copy`.
Types: `web_copy`, `content_gap`, `meta_structure`.

---

## Design System

Light mode only. Accent: `#6C3FF5`. Reference: Acctual.com.

| Token | Hex | | Token | Hex |
|-------|-----|-|-------|-----|
| Background | `#FFFFFF` | | Accent | `#6C3FF5` |
| Surface | `#F9FAFB` | | Accent light | `#EDE9FF` |
| Border | `#E5E7EB` | | Success | `#22C55E` |
| Text heading | `#111827` | | Warning | `#F59E0B` |
| Text body | `#374151` | | Error | `#EF4444` |
| Text muted | `#6B7280` | | | |

**Score:** 0–39 red, 40–69 amber, 70–100 green.

---

## Data Model (key tables)

- **users** — profiles, `credits_balance`
- **workspaces** — brand data (website, industry, competitors)
- **prompts** — 10 AI questions per audit (awareness/consideration/decision)
- **audits** — `status` (pending→running→complete/failed), `visibility_score`
- **audit_results** — per-prompt AI response, `brand_mentioned`, `mention_context`
- **recommendations** — AI suggestions per audit
- **credit_transactions** — audit trail (purchase, debit, bonus)

Supabase project: `bromdpwhiyqpffqxlzcu` | RLS enabled, server inserts use admin client.

---

## Environment Variables

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`

## sessionStorage Keys

`nuave_pending_brand`, `nuave_pending_url`, `nuave_workspace_id`, `nuave_pending_audit_id`

---

## Open Issues

1. "See recommendations" button not navigating from results page
2. Markdown in `suggested_copy` renders as raw text

## Not Yet Built

- Midtrans credit purchase integration
- Blog plan + post generation
- PDF report export

---

## Quick Context for Other AI Tools

```
Project: Nuave — AEO SaaS | Domain: nuave.ai
Stack: Next.js 16 + TypeScript + Tailwind 4 + Supabase + Vercel
UI Language: Bahasa Indonesia | Theme: Light only | Accent: #6C3FF5
Icons: @tabler/icons-react | Fonts: Geist + Inter
AI: Claude claude-sonnet-4-5-20250929 + GPT-4o (web_search)
Middleware: src/middleware.ts (NOT root) | Auth: getUser() not getSession()
Supabase client: createSupabaseBrowserClient() | Admin: createSupabaseAdminClient()
```
