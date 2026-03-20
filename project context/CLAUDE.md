# CLAUDE.md — Nuave Project Context

> Last updated: March 20, 2026

## What is Nuave?

**Nuave** (nuave.ai) — AEO (Answer Engine Optimization) SaaS for Indonesian/Malaysian SMBs.
Measures how often AI tools mention a brand, delivers a 0–100 Visibility Score, generates content fixes.
Credits-based (not subscription). 10 free credits on signup. IDR pricing via Midtrans.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router (TypeScript) |
| Styling | Tailwind v4 utility classes only — tokens via `@theme inline` in `globals.css`, source of truth in `tokens.css` |
| Components | shadcn/ui (18 components in `components/ui/`) — Radix UI primitives |
| Fonts | Geist Sans (`font-heading`) + Inter (`font-body`) |
| Icons | `@tabler/icons-react` only — `lucide-react` has been removed |
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
12. **Sidebar layout:** Sidebar is `fixed left-0`, main content uses `ml-64` offset
13. **UI work:** Always read `DESIGN_SYSTEM.md` before building or modifying any UI (pages, components, layouts)
14. **No lucide-react:** Package has been removed. Use `@tabler/icons-react` exclusively
15. **CSS layers:** Never add unlayered `*`, `body`, or element selectors to globals.css — they override Tailwind utilities. Always use `@layer base`

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

**Full reference:** `DESIGN_SYSTEM.md` (root) — typography scale, spacing scale, component patterns, layout rules, and constraints.

Light mode only. Accent: `#6C3FF5`. Reference: Acctual.com.

| Token | Hex | Tailwind class | | Token | Hex | Tailwind class |
|-------|-----|---------------|-|-------|-----|---------------|
| Background | `#FFFFFF` | `bg-page` | | Accent | `#533AFD` | `bg-brand` / `text-brand` |
| Surface | `#F9FAFB` | `bg-surface` | | Accent dark | `#3d2bc7` | `bg-brand-dark` |
| Surface raised | `#F3F4F6` | `bg-surface-raised` | | Accent light | `#EDE9FF` | `bg-brand-light` |
| Border default | `#E5E7EB` | `border-border-default` | | Success | `#22C55E` | `text-success` |
| Border light | `#ECECEC` | `border-border-light` | | Warning | `#F59E0B` | `text-warning` |
| Border strong | `#D1D5DB` | `border-border-strong` | | Error | `#EF4444` | `text-error` |
| Text heading | `#111827` | `text-text-heading` | | | | |
| Text body | `#374151` | `text-text-body` | | | | |
| Text muted | `#6B7280` | `text-text-muted` | | | | |
| Text placeholder | `#9CA3AF` | `text-text-placeholder` | | | | |

**Score:** 0–39 red, 40–69 amber, 70–100 green.

---

## Styling Conventions

**All new components and pages must follow these rules:**

1. **Tailwind classes only** — no inline `style={{}}` except for truly dynamic runtime values (e.g. progress bar width from state, animation names from config objects, colors from runtime lookup tables)
2. **Design token classes** — use `text-text-muted` not `text-muted-foreground`, `border-border-default` not `border-input`. Exception: inside `components/ui/` shadcn files, leave shadcn tokens untouched
3. **No hardcoded hex values** — always use design token classes from the table above
4. **Arbitrary font-sizes** — every `text-[Xpx]` must have an explicit `leading-*` companion (e.g. `text-[13px] leading-4`)
5. **Transitions** — use `duration-100` (matches `var(--transition-fast)` = 100ms)
6. **Border radius** — `rounded-sm` (6px) for small elements, `rounded-md` (8px) for inputs/cards, `rounded-lg` (12px) for modals
7. **Icons** — import from `@tabler/icons-react` only. PascalCase with `Icon` prefix (e.g. `IconSearch`, `IconX`, `IconPlus`). Use `size` and `stroke` props (not `className` for sizing)
8. **Conditional classes** — use `cn()` from `@/lib/utils` (clsx + tailwind-merge)
9. **Hover states** — use Tailwind `hover:` variants, not `onMouseEnter`/`onMouseLeave` handlers
10. **CSS cascade layers** — all global element resets MUST be inside `@layer base` in globals.css. Unlayered styles override all Tailwind utilities

### Token architecture

```
tokens.css (source of truth) → @theme inline in globals.css → Tailwind utility classes
```

- `tokens.css` defines raw values as CSS custom properties
- `@theme inline` maps them into Tailwind's theme system
- Components use Tailwind classes like `bg-brand`, `text-text-heading`, `shadow-app-subtle`
- Shadows use `shadow-app-*` prefix (e.g. `shadow-app-subtle`, `shadow-app-modal`) to avoid circular reference with same-named `:root` variables

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
Stack: Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui + Supabase + Vercel
Styling: Tailwind utility classes only (no inline styles) — tokens in tokens.css, mapped via @theme inline
UI Language: Bahasa Indonesia | Theme: Light only | Brand: bg-brand (#533AFD)
Icons: @tabler/icons-react ONLY (lucide-react removed) | Fonts: Geist Sans + Inter
AI: Claude claude-sonnet-4-5-20250929 + GPT-4o (web_search)
Middleware: src/middleware.ts (NOT root) | Auth: getUser() not getSession()
Supabase client: createSupabaseBrowserClient() | Admin: createSupabaseAdminClient()
CSS layers: all base resets must be in @layer base — unlayered styles override Tailwind
```
