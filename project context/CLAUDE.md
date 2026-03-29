# CLAUDE.md — Nuave Project Context

> Last updated: March 29, 2026

## What is Nuave?

**Nuave** (nuave.ai) — AEO (Answer Engine Optimization) SaaS for Indonesian/Malaysian SMBs.
Measures how often AI tools mention a brand, delivers a 0–100 Visibility Score, generates content fixes.
Subscription-based with 4 tiers (Free/Starter/Growth/Agency). IDR pricing via Midtrans. Free tier includes 1 full audit on signup (no credits needed).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router (TypeScript) |
| Styling | Tailwind v4 utility classes only — tokens via `@theme inline` in `globals.css`, source of truth in `tokens.css` |
| Components | shadcn/ui (18 components in `components/ui/`) — Radix UI primitives |
| Fonts | Geist Sans (`font-heading`) + Inter (`font-body`) |
| Icons | `@tabler/icons-react` only — `lucide-react` has been removed |
| Database | Supabase PostgreSQL — Singapore (sin1) · **Schema v3** (see `supabase/schema_v3.sql`) |
| Auth | Supabase Auth — Google OAuth only |
| AI — Scraping & Recs | Anthropic **`claude-sonnet-4-5-20250929`** (exact string required) |
| AI — Audit | OpenAI GPT-4o with `web_search` tool |
| Payments | Midtrans (Indonesian payment methods) |
| Hosting | Vercel — auto-deploy from `main` |
| Repo | github.com/yasir-mukhtar/nuave |

---

## File Structure

```
src/
├── app/
│   ├── (dashboard)/        # Route group with sidebar layout — dashboard, prompt, content, brand pages
│   ├── api/                # scrape, generate-prompts, run-audit, audit/[id]/status, recommendations, billing/*, cron/*
│   ├── audit/[id]/         # running, results, recommendations screens
│   ├── auth/               # Login page + OAuth callback
│   ├── onboarding/         # analyze, profile, prompts screens
│   ├── harga/              # Public pricing page
│   ├── privacy/            # Privacy policy
│   ├── terms/              # Terms of service
│   ├── support/            # Contact form (sends email via Resend)
│   ├── globals.css         # Design tokens + component classes
│   └── page.tsx            # Landing page (Bahasa Indonesia)
├── components/             # Sidebar, Topbar, Footer, PlanGate, PlanUpgradeBanner, UpgradeCTA, dashboard panels
├── hooks/                  # useActiveWorkspace, useOrgPlan, useActiveProject
├── lib/supabase/
│   ├── server.ts           # createSupabaseServerClient() + createSupabaseAdminClient()
│   └── client.ts           # createSupabaseBrowserClient()
├── middleware.ts           # Auth middleware (MUST be in src/, not project root)
└── styles/tokens.css       # CSS design tokens
docs/
├── data-architecture-v3.md # Full architecture decisions and rationale
└── REVIEW_PROMPT.md        # Code review guideline — self-review required before presenting code
supabase/
├── schema_v3.sql           # Base schema — source of truth
└── migration_subscription.sql # Subscription model migration (plan tiers, billing tables, RLS)
```

---

## Critical Rules

0. **Self-review after writing code:** After completing any code changes (new files, edits, or refactors), review your own work against `docs/REVIEW_PROMPT.md` before presenting it to the user. Focus on: security (injection, auth gaps, secrets exposure), performance (unnecessary re-renders, N+1 queries, memory leaks), multi-tenancy (every DB query scoped to tenant, RLS active), error handling (no swallowed errors, graceful failures), and TypeScript strictness (no unnecessary `any`). Fix any 🔴 Critical or 🟡 Important issues before finalizing. You do NOT need to output the full review table — just silently fix issues found.
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
16. **Schema v3:** Table names have changed. Use `brands` (not `projects`), `brand_competitors` (not `competitors[]`), `topics` table (not `topics JSONB`), `competitor_snapshots` (not `competitor_analysis`), `content_assets` (not `blog_posts`). See data model below.
17. **Plan enforcement:** All feature gating uses `plan-limits.ts` (config) + `plan-gate.ts` (server checks) + `plan-gate-client.ts` (UI gating). Plans: `free | starter | growth | agency`. Plan checks must **fail closed** — if `getOrgPlan()` returns null, return 404, never proceed.
18. **Billing:** Subscription managed via `/api/billing/*` endpoints. Midtrans Snap for payments. Webhook at `/api/billing/webhook` (signature-verified, idempotent). Rate limited: 5 billing actions/user/hour. `subscription-lifecycle` cron runs daily for downgrade execution + grace period expiry.
19. **Free tier:** Gets 1 full audit on signup (no credits/payment needed). Gated by checking `audits WHERE brand_id AND status='complete' count > 0`. Competitor names visible but data locked. Recommendations titles visible but details locked.

---

## Auth & Route Protection

**Protected routes:** `/dashboard`, `/onboarding`, `/prompt`, `/content`, `/brand`
Unauthenticated → redirect to `/auth?next=<path>`

**Signup flow (v3):**
1. Google OAuth → `handle_new_user()` trigger fires automatically
2. Creates: `users` row → `organizations` (plan=free) → `workspaces` (default) → `organization_members` (owner) → `workspace_members` (admin)
3. Redirect to `/new-project?new=1`
4. User goes through onboarding wizard → first audit runs free (plan-gated, not credit-gated)

---

## Data Architecture (v3)

**Full reference:** `docs/data-architecture-v3.md` and `supabase/schema_v3.sql`

### Hierarchy

```
organizations                    ← billing root, subscription owner
  ├── organization_members       ← roles: owner | admin | member | viewer
  ├── billing_events             ← Midtrans webhook log + subscription events
  ├── refund_requests            ← refund requests with approval flow
  └── workspaces                 ← team boundaries (1 auto-created "My Workspace" for SME)
        ├── workspace_members    ← assigns org members to workspace with scoped role
        └── brands               ← one brand being tracked (was: projects)
              ├── topics         ← content strategy pillars (was: projects.topics JSONB)
              │     └── prompts  ← topic_id nullable = uncategorized prompt
              ├── brand_competitors  ← (was: projects.competitors TEXT[])
              ├── audits         ← time-series: manual | monitoring | monthly_auto
              │     ├── audit_results
              │     └── competitor_snapshots  ← (was: competitor_analysis)
              ├── recommendations    ← brand-level persistent backlog (NOT audit-level)
              └── content_assets    ← (was: blog_posts, broader type system)

credit_transactions              ← org-scoped ledger (legacy, kept for metering history)
```

### Key tables

| Table | Purpose | Key columns |
|---|---|---|
| `organizations` | Billing root | `plan` (free/starter/growth/agency), `subscription_status`, `billing_cycle`, `current_period_end`, `pending_plan` |
| `organization_members` | Org RBAC | `role` (owner/admin/member/viewer), `invited_by` |
| `workspaces` | Team boundaries | `org_id`, `name`, `slug` |
| `workspace_members` | Workspace RBAC | `role` (admin/member/viewer) |
| `brands` | Brand being tracked | `workspace_id`, `onboarding_completed_at`, `differentiators[]` |
| `topics` | Content pillars | `brand_id`, `name`, `display_order` |
| `prompts` | AI questions | `brand_id`, `topic_id` (nullable), `prompt_text`, `stage` |
| `brand_competitors` | Known competitors | `brand_id`, `name`, `website_url` |
| `audits` | Measurement events | `brand_id`, `created_by`, `status`, `visibility_score` |
| `audit_results` | Per-prompt results | `audit_id`, `prompt_id` (SET NULL), `prompt_text` (denormalized) |
| `competitor_snapshots` | Per-audit competitor data | `audit_id`, `competitor_id` (SET NULL), `competitor_name` (denormalized) |
| `recommendations` | Persistent brand backlog | `brand_id`, `source_audit_id`, `last_seen_audit_id`, `status` |
| `content_assets` | Content deliverables | `brand_id`, `type`, `status`, `origin_recommendation_id` |
| `billing_events` | Midtrans webhook log | `org_id`, `event_type`, `midtrans_order_id`, `payload` |
| `refund_requests` | Refund tracking | `org_id`, `requested_by`, `amount`, `status` |
| `credit_transactions` | Legacy credit ledger | `org_id`, `actioned_by`, `audit_id`, `type`, `amount` |

### Recommendations status lifecycle
```
open → applied    (user implemented)
open → dismissed  (user ignored)
applied → resolved (next audit: gap closed)
resolved → open   (regression: gap reappeared)
dismissed → open  (user changed mind)
```

### Recommendation upsert key
When a new audit runs, recommendations are upserted (not duplicated) matching on:
`(brand_id, type, page_target)` using `IS NOT DISTINCT FROM` for nullable `page_target`.
- If existing + `open/dismissed`: update `last_seen_audit_id`
- If existing + `resolved`: reopen it (regression), update `last_seen_audit_id`
- If not found: insert new

### RLS helper functions
```sql
user_orgs()       -- returns org_ids for current user
user_workspaces() -- returns workspace_ids for current user (direct + org admin)
user_brands()     -- returns brand_ids for current user
effective_role(workspace_id) -- returns 'owner'|'admin'|'member'|'viewer'|'none'
```

### DB functions (SECURITY DEFINER — call via API, never direct from client)
```sql
deduct_credits(org_id, amount, actioned_by, audit_id?, description?)  -- legacy, kept for metering
refund_credits(org_id, amount, actioned_by, audit_id?, description?)  -- legacy, kept for metering
-- claim_welcome_credits() has been DROPPED — no longer needed with subscription model
```

### Plan enforcement architecture
```
src/lib/plan-limits.ts      ← Central config: limits, pricing, hierarchy for all 4 tiers
src/lib/plan-gate.ts        ← Server-side: getOrgPlan(), checkRunAudit(), checkCreateBrand(), etc.
src/lib/plan-gate-client.ts ← Client-side: canAccess(plan, feature) for UI gating
src/lib/billing.ts          ← Proration math, refund calc, Midtrans Snap API helpers
src/lib/rate-limit.ts       ← In-memory rate limiter for billing endpoints
src/hooks/useOrgPlan.ts     ← React hook returning plan + limits + subscription status
src/components/PlanGate.tsx  ← UI wrapper: shows children or lock overlay based on plan
```

---

## AI Architecture

- **Claude** (`claude-sonnet-4-5-20250929`): website scraping, profile generation, recommendations
- **GPT-4o** with `web_search`: simulates real user queries for audit
- **Background audit:** `/api/run-audit` → `waitUntil()` → client polls `/api/audit/[id]/status` every 3s
- **Prompts:** Never include brand name. 3 awareness + 4 consideration + 3 decision. 3/10 in Bahasa Indonesia
- **Stale audit reaper:** Audits running >10min auto-marked `failed` during polling

## Recommendations

Free tier: titles visible but details + suggested_copy locked behind upgrade CTA.
Paid tiers: full access, no per-action credit cost (included in subscription).
Types: `technical` (subtype: meta/schema/structure) · `web_copy` · `content` (subtype: blog/page).
Recommendations are **brand-level** — persist across audits. New audit upserts existing, doesn't duplicate.

---

## Design System

**Full reference:** `DESIGN_SYSTEM.md` (root) — typography scale, spacing scale, component patterns, layout rules, and constraints.

Light mode only. Accent: `#533AFD`. Reference: Acctual.com.

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

---

## Environment Variables

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION`, `CRON_SECRET`

## sessionStorage Keys

`nuave_pending_brand`, `nuave_pending_url`, `nuave_workspace_id`, `nuave_pending_audit_id`

---

## Not Yet Built

- Content asset generation UI (blog posts, page copy) — backend exists, no UI
- PDF report export (standard + white-label for Agency)
- Multi-org switcher UI (enterprise)
- Org/workspace management UI (enterprise)
- Monthly-audit cron scalability (currently sequential — needs job queue for 100+ orgs)
- Email notifications for subscription events (payment failure, plan change, etc.)
- Midtrans recurring subscription (currently one-time Snap payments — need recurring billing setup)

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
Billing: Subscription-based (Free/Starter/Growth/Agency). Plan enforcement via plan-limits.ts +
  plan-gate.ts. Midtrans Snap for payments. billing_events + refund_requests tables.
  Credits system removed (legacy tables kept for metering). useOrgPlan hook for UI.
Schema v3: brands(not projects), topics table, brand_competitors table, competitor_snapshots,
  content_assets(not blog_posts), recommendations are brand-level(not audit-level).
  See docs/data-architecture-v3.md + supabase/migration_subscription.sql
```
