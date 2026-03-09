# CLAUDE.md — Nuave Project Context

> This file gives Claude (and other AI tools) full context on the Nuave codebase without
> loading every file. Keep this updated as the project evolves.
> Last updated: March 7, 2026

---

## What is Nuave?

**Nuave** (nuave.id) is an AEO (Answer Engine Optimization) SaaS platform for Indonesian and
Malaysian SMBs. It measures how often AI tools like ChatGPT mention a business's brand, delivers
a 0–100 Visibility Score, and generates actionable content fixes.

**Business goal:** One paying client by end of March 2026.
**Business model:** Credits-based (not subscription). 10 free credits on signup. IDR pricing.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router (TypeScript) |
| Styling | Tailwind CSS + `src/app/globals.css` (custom 4-layer CSS system) |
| Components | shadcn/ui — **new screens only**, never retrofit existing screens |
| Fonts | Geist (headings) + Inter (body) |
| Icons | `@tabler/icons-react` — default `size={18}` `stroke={1.5}` |
| Database | Supabase (PostgreSQL) — Singapore region |
| Auth | Supabase Auth — Google OAuth only (no email/password for MVP) |
| AI — Scraping & Recs | Anthropic Claude — **model: `claude-sonnet-4-5-20250929`** |
| AI — Audit Prompts | OpenAI GPT-4o with web_search tool |
| Payments | Stripe (one-time credit purchases) |
| Hosting | Vercel — auto-deploy from `main` branch |
| Repo | https://github.com/yasir-mukhtar/nuave_v0.3 |
| Production | https://nuave.id / https://nuave.vercel.app |

### Critical model string
Always use `claude-sonnet-4-5-20250929` for Anthropic API calls.
Using `claude-sonnet-4-5` (without date suffix) causes billing errors even with a valid key.

---

## File Structure

```
nuave_v0.3/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Route group: dashboard pages with sidebar layout
│   │   ├── api/
│   │   │   ├── audit/[id]/status/  # GET — poll audit status
│   │   │   ├── generate-prompts/   # POST — generate 10 AEO prompts via OpenAI
│   │   │   ├── health/             # GET — API health check
│   │   │   ├── recommendations/    # POST — generate free rec titles via Claude
│   │   │   │   └── reveal/         # POST — generate suggested_copy (1 credit)
│   │   │   ├── run-audit/          # POST — run GPT-4o audit in background
│   │   │   ├── scrape/             # POST — scrape website + create workspace via Claude
│   │   │   └── user/credits/       # GET — fetch current user's credit balance
│   │   ├── audit/[id]/
│   │   │   ├── recommendations/    # Screen 8
│   │   │   ├── results/            # Screen 7 — THE WOW MOMENT
│   │   │   └── running/            # Screen 6 — audit progress polling
│   │   ├── auth/
│   │   │   ├── page.tsx            # Screen 2 — "Continue your free audit"
│   │   │   └── callback/route.ts   # OAuth callback + user creation + 10 free credits
│   │   ├── dashboard/
│   │   │   └── credits/            # Screen 13 — Buy credits (Stripe)
│   │   ├── harga/                  # Indonesian pricing page (public)
│   │   ├── onboarding/
│   │   │   ├── analyze/            # Screen 3 — scrape animation
│   │   │   ├── profile/            # Screen 4 — company profile review
│   │   │   └── prompts/            # Screen 5 — prompt review + audit trigger
│   │   ├── privacy/                # Privacy policy
│   │   ├── terms/                  # Terms of service
│   │   ├── globals.css             # Design tokens + component system
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Screen 1 — Landing page (Bahasa Indonesia)
│   ├── components/                 # Shared React components
│   ├── hooks/                      # Custom React hooks
│   ├── lib/
│   │   └── supabase/
│   │       ├── server.ts           # createClient() + createSupabaseAdminClient()
│   │       └── client.ts           # Browser client
│   └── styles/                     # Additional CSS files
├── supabase/                       # DB schema + migrations
├── middleware.ts                   # Auth middleware — protects dashboard routes
├── next.config.ts
└── CLAUDE.md                       # This file
```

### Key rule: Admin client location
`createSupabaseAdminClient()` lives in `src/lib/supabase/server.ts`.
There is **no** `admin.ts` file. Do not create one.

---

## Auth Flow

**Gate is placed AFTER form submission but BEFORE any AI processing.**

**Flow A — Not logged in:**
1. Landing form submit → save to `sessionStorage`: `nuave_pending_brand`, `nuave_pending_url`
2. Redirect to `/auth`
3. Auth page shows "Lanjutkan audit gratis Anda" + "Sedang mengaudit: [brand]" pill
4. User clicks "Lanjutkan dengan Google"
5. OAuth callback `/auth/callback` → creates `users` row with `credits_balance: 10`
6. Logs `credit_transactions` bonus record
7. Redirect to `/onboarding/analyze` → reads sessionStorage → auto-triggers scrape

**Flow B — Already logged in:**
Landing form → detects session → skips auth → goes to `/onboarding/analyze`

---

## Supabase Details

| Item | Value |
|------|-------|
| Project ID | `bromdpwhiyqpffqxlzcu` |
| Region | Singapore (sin1) |
| Admin test user ID | `e1a61f8f-115c-48aa-82e2-fd9123d7e21b` |
| Admin credits balance | 999999 (test account) |

### RLS bypass pattern
All server-side INSERTs use `createSupabaseAdminClient()` (service role key) to bypass RLS.

### Critical DB note (March 7, 2026)
The live DB was missing 6 columns that existed in schema.sql. Always verify live DB matches
schema after changes. Run after any `ALTER TABLE`:
```sql
NOTIFY pgrst, 'reload schema';
```

### UUID pre-generation pattern
`/api/scrape` pre-generates the workspace UUID with `randomUUID()` from Node's `crypto` module
**before** INSERT, rather than relying on `.select('id')` after INSERT. This avoids PGRST204.

```typescript
import { randomUUID } from 'crypto';
const workspaceId = randomUUID();
await adminClient.from('workspaces').insert({ id: workspaceId, ... });
// Use workspaceId directly — no SELECT needed
```

---

## Design System

**Reference:** Acctual.com — clean, editorial, light-mode SaaS.
**Theme:** Light mode only. Purple accent `#6C3FF5`.

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#FFFFFF` | Page bg |
| Surface | `#F9FAFB` | Sidebar, panels |
| Border | `#E5E7EB` | All borders |
| Text heading | `#111827` | H1–H3 |
| Text body | `#374151` | Body text |
| Text muted | `#6B7280` | Labels, timestamps |
| Accent | `#6C3FF5` | Buttons, active nav, links |
| Accent light | `#EDE9FF` | Badges, keyword highlights |
| Success | `#22C55E` | Brand mentioned |
| Warning | `#F59E0B` | Partial mention |
| Error | `#EF4444` | Not mentioned, errors |

### Score thresholds
| Range | Label | Color |
|-------|-------|-------|
| 0–39 | Low Visibility | `#EF4444` |
| 40–69 | Moderate Visibility | `#F59E0B` |
| 70–100 | Strong Visibility | `#22C55E` |

### Badge types
| Badge | Text | Background |
|-------|------|-----------|
| High Priority | `#7C3AED` | `#EDE9FE` |
| Medium Priority | `#D97706` | `#FEF3C7` |
| Low Priority | `#374151` | `#F3F4F6` |
| Web Copy | `#6C3FF5` | `#EDE9FF` |
| Content Gap | `#16A34A` | `#DCFCE7` |
| Meta & Structure | `#2563EB` | `#DBEAFE` |

### App Shell (authenticated pages with sidebar)
```tsx
<body className="app-layout">
  <aside className="sidebar"> ... </aside>   {/* MUST be sibling of .main, never inside */}
  <div className="main">
    <header className="topbar"> ... </header>
    <main className="content"> ... </main>
  </div>
</body>
```

---

## AI Architecture

### Dual-AI strategy
- **Claude** (`claude-sonnet-4-5-20250929`): website scraping, profile generation, recommendations
- **GPT-4o** with `web_search` tool: simulates real user queries (authentic ChatGPT simulation)

### Rate limiting rules
- OpenAI calls must be **sequential**, never parallel — 500ms delay between each call
- Claude calls can run in parallel (different rate limit tier)
- All AI responses must be stored in Supabase **before** presenting to user

### Background processing
- `/api/run-audit` returns `{ audit_id, status: 'running' }` immediately
- Processing runs via `processAuditInBackground()` with `globalThis.waitUntil()`
- Client polls `/api/audit/[id]/status` every 3 seconds
- Statuses: `pending` → `running` → `complete` / `failed`

### Prompt engineering rules
- **Never include brand name in prompts** — queries must be problem-first, not brand-first
- **Stage distribution:** 3 awareness + 4 consideration + 3 decision (exactly)
- **Language:** 3 of 10 prompts in Bahasa Indonesia or Bahasa Malaysia
- All responses stored in Supabase before rendering

---

## Recommendations System

Two-step freemium model:
1. **Free:** Claude generates `title` + `description` for all 6 recommendations on page load
   - API: `POST /api/recommendations`
   - Cached in Supabase — skips Claude call if recs already exist for audit
2. **Paid (1 credit):** User clicks "Reveal Fix" → Claude generates `suggested_copy`
   - API: `POST /api/recommendations/reveal`
   - Updates `recommendations.suggested_copy` + `credits_used: 1`

### Recommendation types
- `web_copy` — homepage/page copy improvements
- `content_gap` — missing content AI looks for
- `meta_structure` — schema markup, meta tags, structure

---

## Module Build Status

| Module | Function | Status |
|--------|----------|--------|
| 1 | Intake form → workspaces table | ✅ Complete |
| 2 | Prompt generator via OpenAI | ✅ Complete |
| 3 | GPT-4o audit runner (background) | ✅ Complete |
| 4 | Competitor extractor | ✅ Complete |
| 5 | Visibility score calculation | ✅ Complete |
| 6 | Recommendations (free titles + paid reveal) | ✅ Complete |
| 7 | Auth + user creation + 10 free credits | ✅ Complete |
| 8 | Credits balance in topbar | 🔄 In Progress |
| 9 | Stripe credit purchase | Not Started |
| 10 | Blog plan + post generation | Not Started |
| 11 | Dashboard home | Not Started |
| 12 | PDF report export | Not Started |

---

## Known Issues (as of March 7, 2026)

| # | Issue | Status |
|---|-------|--------|
| 1 | "See recommendations" button not navigating from results page | 🔄 Pending |
| 2 | website_url not saving to workspaces during scrape | ✅ Fixed |
| 3 | company_overview null after profile onboarding | ✅ Fixed |
| 4 | Credits balance shows "—" in topbar — not wired to session | 🔄 Next up (Module 8) |
| 5 | Markdown in suggested_copy renders as raw text | 🔄 Pending |

---

## Language / Localisation

The UI is in **Bahasa Indonesia** (not English). This was implemented March 7, 2026.
- Landing page (`page.tsx`) copy is in Indonesian
- Auth page copy is in Indonesian ("Lanjutkan audit gratis Anda", "Sedang mengaudit: [brand]")
- Results and onboarding screens translated
- `/harga` is the Indonesian pricing page

When writing any user-facing strings, use Bahasa Indonesia unless the context is clearly internal/dev.

---

## Environment Variables

| Variable | Used By |
|----------|---------|
| `OPENAI_API_KEY` | `/api/generate-prompts`, `/api/run-audit` |
| `ANTHROPIC_API_KEY` | `/api/scrape`, `/api/recommendations`, `/api/recommendations/reveal` |
| `NEXT_PUBLIC_SUPABASE_URL` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — admin client |
| `STRIPE_SECRET_KEY` | Credits purchase (server-only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Credits frontend |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook handler |

---

## sessionStorage Keys

| Key | Value |
|-----|-------|
| `nuave_pending_brand` | Brand name from landing form |
| `nuave_pending_url` | Website URL from landing form |
| `nuave_workspace_id` | Set after successful scrape |
| `nuave_pending_audit_id` | Set after audit is triggered |

---

## Coding Rules

1. **Admin client:** Always use `createSupabaseAdminClient()` from `src/lib/supabase/server.ts` for server-side inserts. No separate `admin.ts`.
2. **Pre-generate UUIDs:** Use `randomUUID()` from `crypto` before INSERT — never rely on SELECT after INSERT.
3. **Sequential OpenAI calls:** 500ms delay between each. Never `Promise.all()` for OpenAI.
4. **Model string:** Always `claude-sonnet-4-5-20250929`. No shortcuts.
5. **shadcn/ui:** New screens only. Never touch existing onboarding/results/recommendations screens.
6. **Sidebar structure:** `.sidebar` must be a sibling of `.main`, never nested inside it.
7. **After schema changes:** Always run `NOTIFY pgrst, 'reload schema';` in Supabase SQL editor.
8. **Markdown rendering:** Use `renderMarkdown()` helper for all Claude-generated content displayed to users.

---

## Context Block for New AI Sessions

Paste this at the start of any Cursor / Gemini CLI / v0.dev session:

```
Project: Nuave — AEO (Answer Engine Optimization) SaaS Platform
Stack: Next.js 14 App Router + TypeScript + Tailwind + Supabase + Vercel
Language: Bahasa Indonesia (UI) | Theme: Light mode only | Accent: #6C3FF5
Fonts: Geist (headings) + Inter (body)
Icons: @tabler/icons-react (stroke 1.5, size 18 default)
Components: shadcn/ui for NEW screens only — do not modify existing pages
Design ref: Acctual.com — clean editorial light-mode SaaS
Anthropic model: claude-sonnet-4-5-20250929 (IMPORTANT: use exact string)
Admin Supabase client: createSupabaseAdminClient() in src/lib/supabase/server.ts — NO admin.ts
Repo: https://github.com/yasir-mukhtar/nuave_v0.3
PRD: [attach nuave-prd-v1.2.md]
CLAUDE.md: [attach CLAUDE.md]
```