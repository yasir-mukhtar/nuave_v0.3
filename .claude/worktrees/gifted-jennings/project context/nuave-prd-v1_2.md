# NUAVE
## Product Requirements Document
### AEO (Answer Engine Optimization) Platform
**Version 1.2 · March 2026 · nuave.id**
**Status: Active Development**

---

> **CHANGELOG v1.2 (March 7, 2026)**
> Updated to reflect debugging session and confirmed production state:
> - `workspace_id` null bug: root cause identified and fixed (see Section 6.3)
> - Supabase live DB was missing columns vs schema file — migration applied
> - `/api/scrape` now uses pre-generated UUID to avoid PGRST204 on INSERT
> - `src/lib/supabase/admin.ts` does NOT exist — admin client lives in `server.ts`
> - Known issues list updated: items 2 & 3 resolved, remaining items reprioritised
> - Module status updated
> - Next build target: Module 8 — credits balance wired to topbar

---

> **CHANGELOG v1.1 (March 6, 2026)**
> - Auth flow changed: gate BEFORE audit (not after)
> - Tech stack: React/Vite (not Next.js 14) confirmed
> - shadcn/ui added for new screens only
> - Anthropic model string corrected
> - Module status updated
> - Screen 6 prompt result modal redesigned
> - Recommendations generation model updated

---

## PURPOSE OF THIS DOCUMENT

This PRD is the single source of truth for Nuave. It is designed to be used across AI-assisted development tools — Cursor, Claude.ai, v0.dev, Lovable — to ensure every screen, component, API, and database decision stays consistent, performant, and cohesive regardless of which tool is being used to build it.

**Target Launch:** End of March 2026
**Domain:** nuave.id
**Primary Market:** Indonesian & Malaysian SMBs

---

## 1. Product Overview

### 1.1 What is Nuave?

Nuave is an Answer Engine Optimization (AEO) SaaS platform. It helps businesses measure and improve how often AI tools like ChatGPT mention their brand when real users ask questions.

As AI-powered search engines (ChatGPT, Perplexity, Gemini, Claude) become primary discovery tools, businesses face a new visibility challenge: their website might rank on Google but be completely invisible in AI-generated answers. Nuave solves this.

### 1.2 The Core Problem

- Traditional SEO optimizes for Google search rankings
- But millions of users now ask AI tools: 'What's the best accounting software for a small restaurant?'
- AI answers don't pull from Google rankings — they reflect the AI's training data and web knowledge
- Businesses have no visibility into whether AI tools mention them — or mention competitors instead
- There is no existing tool that audits, scores, and improves AI brand visibility

### 1.3 The Solution — The Core Loop

1. User enters their brand name and website URL
2. **User is prompted to sign up / log in (auth gate before audit)**
3. System scrapes the website and builds a company profile automatically using Claude AI
4. System generates 10 tailored prompts — questions real users ask ChatGPT about their category
5. All 10 prompts are sent to GPT-4o — responses are analyzed for brand mentions
6. A Visibility Score (0–100) is produced showing AI brand presence
7. Product delivers: web copy improvements + AI-optimized blog content to close the gap

> **Key decision:** Auth gate is placed AFTER the user enters brand + URL but BEFORE the audit runs. This captures user intent at peak motivation, eliminates anonymous API spend, and achieves higher signup conversion than a cold auth wall.

### 1.4 Business Model

Credits-based, not subscription. This lowers the barrier to entry for SMBs and aligns cost with usage.

| Action | Credits Required |
|--------|-----------------|
| Run audit (10 prompts) | 10 credits |
| Add 10 extra prompts to audit | 10 credits |
| Generate web copy improvement (reveal fix) | 1 credit |
| Generate blog post | 2 credits |
| Re-analyze website copy | 3 credits |
| Export PDF report | Free |

Credit packages (priced in IDR):

| Package | Credits | Price (IDR) | Notes |
|---------|---------|-------------|-------|
| Starter | 50 | Rp 75.000 | |
| **Growth** | **150** | **Rp 199.000** | **Most Popular** |
| Agency | 500 | Rp 599.000 | |

New users receive **10 free credits** upon registration — enough for one complete audit.

> **First audit uses 10 credits from the free balance** (not a free bypass). Users must register to run any audit.

### 1.5 Target Users

| Persona | Description | Primary Pain |
|---------|-------------|-------------|
| SMB Owner | Small business owner in ID/MY, non-technical | No idea if AI mentions their brand |
| Marketing Manager | In-house marketer at a growing brand | Can't measure ROI of content for AI |
| Digital Agency | Agency managing 5–20 client brands | Needs scalable AEO auditing for clients |
| Founder / Startup | Early-stage founder validating market position | Wants to know if AI knows they exist |

### 1.6 Key Differentiators

- First AEO audit tool targeting Indonesian/Malaysian market with IDR pricing
- Credits model — no subscription pressure, pay per audit
- Automated website scraping — no manual input required beyond URL
- Dual-AI architecture: Claude for analysis + GPT-4o for authentic AI simulation
- Prompt framing methodology: problem-first, never brand-first queries
- Auth-gated from step 1 — every audit is tied to a real user account

---

## 2. Technology Stack

### 2.1 Stack Decisions

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend Framework | Next.js 14 (App Router) | SSR + client components, Vercel-native |
| Language | TypeScript | Type safety across full stack |
| Styling | Tailwind CSS + globals.css | Utility-first; custom CSS for existing screens |
| Component Library | shadcn/ui (new screens only) | Used for Auth, Dashboard, Credits — NOT retrofitted to existing screens |
| Font | Geist (headings) + Inter (body) | Dual typography: impact + readability |
| Icons | @tabler/icons-react | 5900+ MIT-licensed icons, consistent stroke style |
| Database | Supabase (PostgreSQL) | Auth + DB + realtime in one platform |
| Auth | Supabase Auth | Google OAuth only (email/password deprioritized for MVP) |
| AI — Analysis | Claude (Anthropic) | Website scraping, profile generation, recommendations |
| AI — Prompt Testing | OpenAI GPT-4o | Simulates real user queries for authentic results |
| Payments | Stripe | One-time credit purchases, no subscriptions |
| Hosting | Vercel | Zero-config Next.js deployment, edge functions |
| Dev Environment | Cursor (local) | AI-assisted development, TypeScript LSP |
| Version Control | GitHub | Source of truth, Vercel auto-deploy from main |

> **shadcn/ui Policy:** Installed but used only for new screens (Auth, Dashboard, Buy Credits). Existing screens (Landing, Onboarding, Results, Recommendations) keep their current custom CSS to avoid regression risk before launch.

### 2.2 Frontend Architecture

The frontend is built with Next.js 14 App Router. Originally prototyped in Bolt as Vanilla HTML/CSS/JS (13 static screens), migrated to Next.js with React components in Cursor.

**CSS Architecture (4-Layer System)**

| File | Purpose |
|------|---------|
| 01-tokens.css | Design tokens — CSS variables, spacing scale, color palette, typography |
| 02-reset-base.css | Global reset and base element styles |
| 03-layout.css | App shell, sidebar (220px), topbar, .main content area |
| 04-components.css | Buttons, inputs, cards, badges, pills, trust elements |
| globals.css | Extended component system: .card, .card-row, .card-hover, form-field inputs, mobile responsive |

**App Shell Structure**

Every authenticated page (with sidebar) must follow this exact HTML/JSX structure:

```
<body class="app-layout">
  <aside class="sidebar"> ... </aside>
  <div class="main">
    <header class="topbar"> ... </header>
    <main class="content"> ... </main>
  </div>
</body>
```

CRITICAL: Never place .sidebar inside .main — this causes content overlap.

### 2.3 AI Architecture

**Dual-AI Strategy**

| Role | Model | Why |
|------|-------|-----|
| Website scraping & profile generation | Claude (Anthropic) `claude-sonnet-4-5-20250929` | Superior at structured extraction and nuanced analysis |
| Simulate real user prompts | OpenAI GPT-4o with web_search | Authentic simulation of what users actually ask ChatGPT |
| Recommendations generation | Claude (Anthropic) `claude-sonnet-4-5-20250929` | Long-form reasoning, copywriting quality |
| Blog post generation | Claude (Anthropic) `claude-sonnet-4-5-20250929` | Editorial quality, SEO-aware writing |

> **CRITICAL:** Always use model string `claude-sonnet-4-5-20250929` for Anthropic API calls. Incorrect model strings (e.g. `claude-sonnet-4-5`) cause billing errors even with valid API keys.

**Rate Limiting Rules**

- OpenAI API calls must be sequential, NOT parallel — avoids rate limit errors
- Add a 500ms delay between sequential calls as standard practice
- Claude API calls for analysis can run in parallel (different rate limit tier)
- All API responses must be stored in Supabase before presenting to user

**Background Processing**

Audit processing runs server-side as a background job:
- `/api/run-audit` returns `{ audit_id, status: 'running' }` immediately
- `processAuditInBackground()` runs async via `globalThis.waitUntil()`
- Client polls `/api/audit/[id]/status` every 3 seconds
- Users can close browser and return — audit completes regardless
- Audit statuses: `pending` → `running` → `complete` / `failed`

### 2.4 Environment Variables

| Variable | Purpose | Used By |
|----------|---------|---------|
| OPENAI_API_KEY | GPT-4o prompt testing | Module 3, 4 |
| ANTHROPIC_API_KEY | Claude scraping & generation | Modules 1, 5, 6, 7 |
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | All modules |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase public key | All modules |
| SUPABASE_SERVICE_ROLE_KEY | Supabase admin (server-side only) | Server components |
| STRIPE_SECRET_KEY | Stripe payments (server-side) | Credits module |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe frontend | Buy credits screen |
| STRIPE_WEBHOOK_SECRET | Verify Stripe webhooks | Webhook handler |

---

## 3. Database Schema

Database: Supabase (PostgreSQL). All tables use UUID primary keys and include created_at timestamps. Row Level Security (RLS) is enabled on all tables.

### 3.1 Entity Relationship

```
users → workspaces → prompts → audits → audit_results → recommendations → blog_posts
users → credit_transactions
audits → competitor_analysis
```

### 3.2 Table Definitions

**users**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | References auth.users — Supabase Auth |
| email | TEXT | User email address |
| full_name | TEXT | Display name |
| credits_balance | INTEGER | Default: 10 (free credits on signup) |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Auto-updated |

**workspaces**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Pre-generated with `randomUUID()` before INSERT — never rely on DB to generate |
| user_id | UUID (FK) | References users.id — nullable (anonymous sessions allowed) |
| brand_name | TEXT | Business name |
| website_url | TEXT | Full URL including https:// |
| language | TEXT | e.g. 'en', 'id', 'ms' — default 'en' |
| company_overview | TEXT | AI-generated from website scrape |
| differentiators | TEXT[] | Array of unique value props |
| competitors | TEXT[] | Array of known competitor names |
| industry | TEXT | e.g. 'accounting', 'restaurant', 'retail' |
| target_audience | TEXT | AI-inferred target customer |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

> **CRITICAL — Live DB migration note (March 7):** The columns `industry`, `differentiators`, `competitors`, `target_audience`, `language`, and `company_overview` were absent from the live Supabase database even though they existed in schema.sql. This caused PGRST204 errors on every INSERT. The following migration was run manually in the Supabase SQL editor on March 7, 2026:
> ```sql
> ALTER TABLE workspaces
>   ADD COLUMN IF NOT EXISTS industry TEXT,
>   ADD COLUMN IF NOT EXISTS differentiators TEXT[],
>   ADD COLUMN IF NOT EXISTS competitors TEXT[],
>   ADD COLUMN IF NOT EXISTS target_audience TEXT,
>   ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
>   ADD COLUMN IF NOT EXISTS company_overview TEXT;
> NOTIFY pgrst, 'reload schema';
> ```
> If rebuilding from scratch or resetting the DB, run this migration immediately after initial schema setup.

**prompts**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| workspace_id | UUID (FK) | References workspaces.id |
| prompt_text | TEXT | The actual question sent to GPT-4o |
| stage | TEXT | awareness / consideration / decision |
| language | TEXT | en / id / ms |
| is_active | BOOLEAN | Default true |
| display_order | INTEGER | Sort order (1–10) |
| created_at | TIMESTAMPTZ | |

**audits**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| workspace_id | UUID (FK) | References workspaces.id |
| status | TEXT | pending / running / complete / failed |
| visibility_score | INTEGER | 0–100, null until complete |
| total_prompts | INTEGER | Number of prompts in this audit |
| brand_mention_count | INTEGER | How many responses mentioned the brand |
| credits_used | INTEGER | Credits deducted for this audit |
| created_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | Null until status = complete |

**audit_results**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| audit_id | UUID (FK) | References audits.id |
| prompt_id | UUID (FK) | References prompts.id |
| prompt_text | TEXT | Snapshot of prompt at time of audit |
| ai_response | TEXT | Full GPT-4o response |
| brand_mentioned | BOOLEAN | Was the brand name in the response? |
| mention_context | TEXT | Extract of text around the brand mention |
| mention_sentiment | TEXT | positive / neutral / negative |
| competitor_mentions | TEXT[] | Competitor names found in response |
| position_rank | INTEGER | If listed, what rank was the brand? Null if not listed |
| created_at | TIMESTAMPTZ | |

**competitor_analysis**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| audit_id | UUID (FK) | References audits.id |
| competitor_name | TEXT | Name of competitor brand |
| mention_count | INTEGER | Times mentioned across all audit prompts |
| mention_frequency | FLOAT | mention_count / total_prompts |
| avg_position | FLOAT | Average rank position when listed |
| created_at | TIMESTAMPTZ | |

**recommendations**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| audit_id | UUID (FK) | References audits.id |
| type | TEXT | web_copy / meta_structure / content_gap |
| priority | TEXT | high / medium / low |
| title | TEXT | Short headline for the recommendation |
| description | TEXT | Detailed explanation |
| page_target | TEXT | Which page this applies to (e.g. "Homepage") |
| suggested_copy | TEXT | AI-generated fix — revealed on credit spend |
| credits_used | INTEGER | 0 = not yet revealed; 1 = revealed |
| created_at | TIMESTAMPTZ | |

> **Recommendations generation model:** Titles + descriptions generated FREE on page load. `suggested_copy` generated on demand for 1 credit via `/api/recommendations/reveal`.

**blog_posts**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| audit_id | UUID (FK) | References audits.id |
| workspace_id | UUID (FK) | References workspaces.id |
| title | TEXT | Blog post headline |
| slug | TEXT | URL-safe slug |
| content | TEXT | Full markdown content |
| target_query | TEXT | The AEO prompt this post targets |
| status | TEXT | draft / published |
| credits_used | INTEGER | 2 per generation |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**credit_transactions**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| user_id | UUID (FK) | References users.id |
| type | TEXT | purchase / debit / bonus |
| amount | INTEGER | Positive = credit added, negative = deducted |
| balance_after | INTEGER | credits_balance after this transaction |
| description | TEXT | e.g. 'Audit: nuave.id', 'Starter Pack Purchase' |
| stripe_payment_intent_id | TEXT | Null for non-purchase transactions |
| created_at | TIMESTAMPTZ | |

### 3.3 Row Level Security (RLS) Rules

- users: users can only read/update their own row
- workspaces: users can only CRUD their own workspaces (user_id = auth.uid())
- prompts, audits, audit_results, recommendations, blog_posts: scoped through workspace ownership
- credit_transactions: users can only read their own transactions; only service role can insert
- competitor_analysis: read-only for workspace owners

> **RLS bypass pattern:** All server-side INSERTs use `createSupabaseAdminClient()` (service role key) to bypass RLS. The admin client is defined in `src/lib/supabase/server.ts` — there is NO separate `admin.ts` file. Do not create one.

---

## 4. Screens & User Flows

Nuave has 13 screens across three functional zones: Onboarding/Audit Flow, Auth, and Authenticated Dashboard.

### 4.1 Screen Map

| # | Screen | Route | Auth Required | Zone |
|---|--------|-------|--------------|------|
| 1 | Landing Page | / | No | Public |
| 2 | Auth Modal | /auth | No | Auth |
| 3 | Analysis Progress | /onboarding/analyze | Yes* | Onboarding |
| 4 | Company Profile Review | /onboarding/profile | Yes* | Onboarding |
| 5 | Prompt Review | /onboarding/prompts | Yes* | Onboarding |
| 6 | Audit Running | /audit/:id/running | Yes* | Onboarding |
| 7 | Visibility Score | /audit/:id/results | Yes* | Results |
| 8 | Recommendations | /audit/:id/recommendations | Yes | Results |
| 9 | Blog Plan | /audit/:id/blog-plan | Yes | Results |
| 10 | Blog Post View | /content/:blogId | Yes | Dashboard |
| 11 | Dashboard Home | /dashboard | Yes | Dashboard |
| 12 | Prompts Manager | /dashboard/prompts | Yes | Dashboard |
| 13 | Buy Credits | /dashboard/credits | Yes | Dashboard |

> *Yes* = Auth required. Users are gated at Screen 2 before any AI processing begins. sessionStorage preserves brand + URL through the auth redirect.

### 4.2 Auth Flow (Updated)

**Flow A — Not logged in:**
1. User enters brand name + URL on landing page
2. Data saved to sessionStorage (`nuave_pending_brand`, `nuave_pending_url`)
3. Redirected to `/auth`
4. Auth page shows "Continue your free audit" + "Auditing: [brand]" pill
5. User signs in with Google OAuth
6. Callback at `/auth/callback` creates user record with 10 free credits
7. Auto-redirects to `/onboarding/analyze` which reads sessionStorage and starts scraping

**Flow B — Already logged in:**
1. User enters brand name + URL on landing page
2. Session detected → skip auth
3. Go directly to `/onboarding/analyze`

**New user creation on first OAuth:**
- Creates row in `users` table with `credits_balance: 10`
- Creates row in `credit_transactions` (type: 'bonus', amount: 10, description: 'Welcome bonus')

### 4.3 Screen Specifications

**Screen 1 — Landing Page (/)**

| Element | Description |
|---------|-------------|
| Hero headline | "Does ChatGPT know your brand?" |
| Subheadline | Brief explanation of AEO and the 10-point visibility score |
| Inline form | Two fields: Brand Name + Website URL → CTA button 'Start Free Audit' |
| Trust bar | 'Free' · 'No sign up required' · 'Results in 60 seconds' |
| Nav | Log in button + Start free audit button |

**Screen 2 — Auth (/auth)**

Shown after form submission when no session exists. Framed as continuation, not a cold wall.

| Element | Description |
|---------|-------------|
| Headline | "Continue your free audit" |
| Brand pill | "Auditing: [brand name]" — reads from sessionStorage, no arrow icon |
| CTA | "Continue with Google" button with Google icon |
| No OR separator | Removed — Google OAuth only for MVP |

**Screen 3 — Analysis Progress (/onboarding/analyze)**

Animated step list while Claude scrapes the website. Reads `nuave_pending_brand` + `nuave_pending_url` from sessionStorage on mount and auto-triggers scrape.

**Screen 4 — Company Profile Review (/onboarding/profile)**

Two-column layout: editable form left, live structured preview right.

**Screen 5 — Prompt Review (/onboarding/prompts)**

10 AI-generated prompts grouped by stage. Clicking "Run Audit" saves audit_id to sessionStorage and immediately redirects to running screen (background processing begins).

**Screen 6 — Audit Running (/audit/:id/running)**

Polls `/api/audit/[id]/status` every 3 seconds. Auto-redirects to results when complete.

**Screen 7 — Visibility Score (/audit/:id/results)**

The primary value-delivery screen.

- Large animated score circle (0–100) with color thresholds
- "1 of 10 prompts mentioned your brand" stat
- Per-prompt result list: click any row to open Prompt Result panel
- **Prompt Result Panel** — fixed panel (top/right/bottom: 24px), not full-edge:
  - User prompt bubble (purple, right-aligned)
  - Mention status badge: `IconCircleCheckFilled` (green) or `IconCircleXFilled` (red), bg #F4F4F4, right-aligned
  - AI response: plain text with brand keyword highlighted in purple (#EDE9FF bg, #6C3FF5 text)
  - Rich text rendering: headings, bold, bullet points from markdown
  - Footer: "Response by GPT-4o with web search · [timestamp]"
  - Three-zone layout: sticky header / scrollable content / sticky footer
- CTA: "See recommendations →" button

**Screen 8 — Recommendations (/audit/:id/recommendations)**

| Element | Description |
|---------|-------------|
| Topbar | Back to results · Brand name · Credits balance |
| Hero | "Here's how to get ChatGPT to mention you" |
| Filter tabs | All · Web Copy · Content Gaps · Meta & Structure |
| Cards | Auto-generated free on page load via Claude |
| Card anatomy | Priority badge + Type badge + Page target + Title + Description + Reveal Fix button |
| Reveal Fix | Costs 1 credit · Calls `/api/recommendations/reveal` · Shows suggested copy with Copy button |
| Suggested copy | Rendered as rich text (markdown → HTML) |

> **Generation model:** Recommendations titles/descriptions are FREE (generated on page load). Only `suggested_copy` costs 1 credit (on demand).

**Screens 9–13** — unchanged from v1.0.

### 4.4 Navigation Rules

- Landing (Screen 1): no sidebar, no auth
- Auth (Screen 2): no sidebar, no auth
- Onboarding (Screens 3–6): no sidebar, auth required
- Results (Screens 7–8): no sidebar, auth required
- Dashboard (Screens 9–13): full sidebar + topbar, auth required
- Topbar always shows: credits balance (with buy link) + user avatar + workspace name

---

## 5. Design System

Design reference: Acctual.com — clean, editorial, light-mode SaaS. Professional and minimal with purposeful purple accents.

### 5.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| --color-bg | #FFFFFF | Page background |
| --color-surface | #F9FAFB | Sidebar, panels, secondary cards |
| --color-border | #E5E7EB | All borders |
| --color-text-heading | #111827 | H1, H2, H3, card titles |
| --color-text-body | #374151 | Body text, descriptions, labels |
| --color-text-muted | #6B7280 | Placeholder, secondary labels, timestamps |
| --color-accent | #6C3FF5 | Primary buttons, active nav, links, focus rings |
| --color-accent-light | #EDE9FF | Accent backgrounds, badges, keyword highlights |
| --color-success | #22C55E | Brand mentioned — green badge |
| --color-warning | #F59E0B | Partial mention — amber badge |
| --color-error | #EF4444 | Not mentioned — red badge, errors |

### 5.2 Typography

**Dual-font system:**
- Headings (h1–h6): Geist — installed via `geist` npm package as `GeistSans`
- Body (p, span, div, inputs, buttons): Inter — via `next/font/google`

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Display | 48px / 3rem | 700 | Landing hero headline |
| H1 | 32px / 2rem | 700 | Page titles |
| H2 | 24px / 1.5rem | 600 | Section titles |
| H3 | 18px / 1.125rem | 600 | Sub-section titles |
| Body Large | 16px / 1rem | 400 | Main body text |
| Body | 14px / 0.875rem | 400 | Secondary text, table rows |
| Caption | 12px / 0.75rem | 400 | Labels, timestamps, hints |
| Badge | 11px / 0.6875rem | 600 | Status badges, priority pills |

### 5.3 Component Specifications

**Cards (Acctual-inspired)**

```css
.card {
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid rgba(225, 228, 234, 1);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  padding: 24px;
}

.card-hover::before {
  /* Double-border hover effect */
  border: 2px solid transparent;
  transition: border-color 0.15s;
}

.card-hover:hover::before {
  border-color: #6C3FF5;
}
```

**Input Fields (Acctual-inspired)**

```css
/* No visible border — layered box-shadow for depth */
box-shadow: 0px 0px 0px 1px rgba(0,0,0,0.11), 0px 0px 1px 0px rgba(0,0,0,0.07);
height: 36px;
border-radius: 6px;
/* Hover: darker shadow; Focus: shadow + ring */
```

**Buttons**

| Variant | Background | Text | Hover |
|---------|-----------|------|-------|
| Primary | #6C3FF5 | #FFFFFF | opacity 0.9 |
| Secondary | #FFFFFF | #374151 | bg: #F9FAFB |
| Destructive | #EF4444 | #FFFFFF | opacity 0.9 |
| Ghost | transparent | #374151 | bg: #F9FAFB |

**Badge Types**

| Badge | Text Color | Background |
|-------|-----------|-----------|
| Mentioned | #16A34A | #DCFCE7 |
| Not Mentioned | #DC2626 | #FEE2E2 |
| High Priority | #7C3AED | #EDE9FE |
| Medium Priority | #D97706 | #FEF3C7 |
| Low Priority | #374151 | #F3F4F6 |
| Web Copy | #6C3FF5 | #EDE9FF |
| Content Gap | #16A34A | #DCFCE7 |
| Meta & Structure | #2563EB | #DBEAFE |

### 5.4 Score Color Thresholds

| Score Range | Label | Color | Hex |
|------------|-------|-------|-----|
| 0–39 | Low Visibility | Red | #EF4444 |
| 40–69 | Moderate Visibility | Amber | #F59E0B |
| 70–100 | Strong Visibility | Green | #22C55E |

### 5.5 Icon System

Library: `@tabler/icons-react`
Default props: `size={18}` `stroke={1.5}` `color="currentColor"`

Key icons in use:
- `IconCircleCheckFilled` — brand mentioned (green, size 20)
- `IconCircleXFilled` — not mentioned (red, size 20)
- `IconSparkles` — Reveal Fix button
- `IconCopy` — copy to clipboard
- `IconArrowRight` — navigation CTAs
- `IconCoins` — credits balance

---

## 6. Build Phases & Module Status

### 6.1 Phase Overview

| Phase | What | Status |
|-------|------|--------|
| 1 | Core loop: landing → auth → scrape → profile → prompts | ✅ Complete |
| 2 | Audit: GPT-4o testing → visibility score | ✅ Complete |
| 3 | Recommendations screen + reveal fix | ✅ Complete |
| 4 | Auth, credits display, Stripe payments, dashboard | 🔄 In Progress |
| 5 | Blog plan + post generation, polish, PDF export, domain | Not Started |

### 6.2 Module Status

| Module | Function | Supabase Table | Status |
|--------|----------|---------------|--------|
| Module 1 | Intake form → Supabase | workspaces | ✅ Complete |
| Module 2 | Query generator via OpenAI | prompts | ✅ Complete |
| Module 3 | Query runner → stores AI responses (background) | audit_results | ✅ Complete |
| Module 4 | Competitor extractor | competitor_analysis | ✅ Complete |
| Module 5 | Visibility score calculation | audits | ✅ Complete |
| Module 6 | Recommendations generator (free titles + paid reveal) | recommendations | ✅ Complete |
| Module 7 | Auth + user creation + credits | users, credit_transactions | ✅ Complete |
| Module 8 | Credits display in topbar | users | 🔄 Next up |
| Module 9 | Stripe credit purchase | credit_transactions | Not Started |
| Module 10 | Blog plan + post generation | blog_posts | Not Started |
| Module 11 | Dashboard home | workspaces, audits | Not Started |
| Module 12 | PDF report export | — | Not Started |

### 6.3 Bug History & Fixes (March 7, 2026 session)

This section documents the multi-hour debugging session on the `workspace_id null` bug, so future sessions understand why the code is shaped the way it is.

**Symptom:** Every audit produced `workspace_id: null` in sessionStorage. The `workspaces` table in Supabase received no new rows.

**Root cause (confirmed):** The live Supabase database was missing 6 columns that existed in `schema.sql` but had never been applied via migration: `industry`, `differentiators`, `competitors`, `target_audience`, `language`, `company_overview`. PostgREST (Supabase's REST layer) caches the schema and rejects INSERTs that reference unknown columns with a `PGRST204` error — even when using the service role key.

**Misleading red herrings investigated:**
- Initially suspected `.select('id').single()` after INSERT causing PGRST204 — changed to array select, no fix
- Suspected `admin.ts` file was missing — confirmed it does not exist and never should; `createSupabaseAdminClient()` lives in `server.ts`
- Suspected `user_id` NOT NULL constraint blocking null inserts — confirmed nullable via schema.sql
- Suspected session cookie not forwarded to API route — disproved by debug log showing correct user ID

**Fix applied (two parts):**

1. **Code fix** (`src/app/api/scrape/route.ts`): Switched from relying on `.select('id')` after INSERT to pre-generating the UUID with `randomUUID()` from Node's `crypto` module before the INSERT. This eliminates any dependency on the SELECT returning data, making the workspace_id available regardless of PostgREST SELECT behaviour.

```typescript
import { randomUUID } from 'crypto';
// ...
const workspaceId = randomUUID();
const { error: wsError } = await adminClient
  .from('workspaces')
  .insert({ id: workspaceId, ... });
// Use workspaceId directly — no SELECT needed
return NextResponse.json({ workspace_id: wsError ? null : workspaceId, ... });
```

2. **DB fix** (Supabase SQL editor): Added missing columns and reloaded PostgREST schema cache:

```sql
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS differentiators TEXT[],
  ADD COLUMN IF NOT EXISTS competitors TEXT[],
  ADD COLUMN IF NOT EXISTS target_audience TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS company_overview TEXT;
NOTIFY pgrst, 'reload schema';
```

**Verification:** After both fixes, `/api/scrape` returns `workspace_id: "295fe80e-db9a-400a-b225-5f6bb53da188"` (real UUID), a new row appears in the workspaces table, and the profile review screen populates with scraped data.

**Lesson learned:** Always verify the live database schema matches `schema.sql` after any schema changes. PostgREST's schema cache is a silent failure mode — the INSERT itself may succeed but PostgREST returns 204 if it doesn't recognise the columns. Run `NOTIFY pgrst, 'reload schema'` after any `ALTER TABLE`.

### 6.4 Known Issues (as of v1.2)

| # | Issue | Status |
|---|-------|--------|
| 1 | "See recommendations" button on results page not navigating | 🔄 Pending |
| 2 | website_url empty in workspaces table — not saved after scrape | ✅ Fixed (March 7) |
| 3 | company_overview null in workspaces — profile data not persisted | ✅ Fixed (March 7) |
| 4 | Credits balance shows "—" in topbar — not wired to user session | 🔄 Next (Module 8) |
| 5 | Markdown in suggested copy rendering as raw text — needs renderMarkdown applied | 🔄 Pending |

### 6.5 Prompt Engineering Rules

| Rule | Description |
|------|-------------|
| Never include brand name in prompts | Queries must be problem-first, not brand-first |
| Stage distribution | Every audit must have exactly: 3 awareness + 4 consideration + 3 decision |
| Language distribution | 3 of 10 prompts in local language (Bahasa Indonesia or Malaysia) |
| Sequential API calls | OpenAI calls must be sequential with 500ms delay |
| Store before display | All AI responses stored in Supabase before rendering |

---

## 7. API Routes

All API routes are Next.js App Router route handlers in /app/api/. All routes are server-side.

### 7.1 Route Map

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/scrape | No | Scrape website URL, return structured profile via Claude |
| POST | /api/generate-prompts | No | Generate 10 AEO prompts from company profile |
| POST | /api/run-audit | Yes* | Run all prompts through GPT-4o (background), return audit_id immediately |
| GET | /api/audit/:id | Yes* | Get audit status and results |
| GET | /api/audit/:id/status | Yes* | Poll audit status — returns running/complete/failed |
| POST | /api/extract-competitors | Yes* | Run competitor extraction on audit results |
| POST | /api/recommendations | Yes | Generate recommendation titles + descriptions (FREE) |
| POST | /api/recommendations/reveal | Yes | Generate suggested_copy for one recommendation (1 credit) |
| POST | /api/generate-blog | Yes | Generate blog post from target query (2 credits) |
| POST | /api/credits/purchase | Yes | Create Stripe checkout session |
| POST | /api/webhooks/stripe | No | Handle Stripe payment success → credit balance update |
| GET | /api/workspaces | Yes | List all workspaces for authenticated user |
| POST | /api/workspaces | Yes | Create new workspace |
| PATCH | /api/workspaces/:id | Yes | Update workspace profile |

*Yes* = No hard auth block but audit is linked to user if session exists.

---

## 8. AI Tool Handoff Guide

### 8.1 Tool Assignments

| Tool | Owns | Do NOT use for |
|------|------|---------------|
| Cursor | All TypeScript logic, API routes, tokens.css, sidebar, dashboard, prompts manager | Visual-first screens |
| Claude.ai Artifacts | Landing page, auth page, analysis progress, prompt review, audit running | Full-stack logic |
| v0.dev | Visibility score screen, blog plan screen, buy credits screen | App logic, API calls |
| Lovable | Company profile review (two-column form) | Other screens |
| Gemini CLI | Bulk/mechanical file edits, committing code, running SQL | Architecture decisions |

> **Workflow convention:** Gemini CLI handles all file creation/edits and git commits. Claude.ai handles architecture decisions, debugging strategy, root cause analysis, and code review. Never ask Gemini to architect; never ask Claude to write files directly to the repo.

### 8.2 Context Block for New Sessions

Always paste this block at the start of any new AI tool session:

```
Project: Nuave — AEO (Answer Engine Optimization) SaaS Platform
Stack: Next.js 14 App Router + TypeScript + Tailwind + Supabase + Vercel
Font: Geist (headings) + Inter (body) | Theme: Light mode only | Accent: #6C3FF5
Icons: @tabler/icons-react (stroke 1.5, size 18 default)
Components: shadcn/ui for NEW screens only — do not modify existing pages
Design ref: Acctual.com — clean editorial light-mode SaaS
Anthropic model: claude-sonnet-4-5-20250929 (IMPORTANT: use exact string)
Admin client: createSupabaseAdminClient() is in src/lib/supabase/server.ts — NO admin.ts file exists
PRD: [attach nuave-prd-v1.2]
```

---

## 9. Security & Compliance

*(Unchanged from v1.0)*

---

## 10. Launch Checklist

**Target:** End of March 2026. One paying client as success criterion.

### 10.1 MVP Requirements (Must-Have)

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Landing page with audit form | ✅ Done |
| 2 | Auth gate (Google OAuth) with 10 free credits on signup | ✅ Done |
| 3 | Website scraping + company profile generation (Claude) | ✅ Done |
| 4 | 10-prompt generation with stage distribution | ✅ Done |
| 5 | GPT-4o audit runner (sequential, background) | ✅ Done |
| 6 | Visibility score calculation (0–100) | ✅ Done |
| 7 | Visibility Score results screen with prompt modal | ✅ Done |
| 8 | Recommendations screen (free titles + paid reveal) | ✅ Done |
| 9 | workspace_id saved correctly to Supabase on every audit | ✅ Done (March 7) |
| 10 | Fix: "See recommendations" button navigation | 🔄 Pending |
| 11 | Credits balance wired to topbar (Module 8) | 🔄 Next |
| 12 | Stripe credit purchase (3 packages) | Not Started |
| 13 | Dashboard home | Not Started |
| 14 | Blog post generation (Claude) | Not Started |
| 15 | PDF report export | Not Started |
| 16 | Deploy to Vercel + nuave.id domain | ✅ Done (nuave.id live) |

### 10.2 Nice-to-Have (Post-Launch)

- Re-audit comparison: show score change over time
- Competitor tracking: monitor competitor mention frequency trend
- Multi-language UI (Bahasa Indonesia)
- White-label report for agency users
- API access tier for developers
- Slack/email alerts when score drops
- Prompts Manager screen (/dashboard/prompts)

---

## Appendix

### A. Glossary

| Term | Definition |
|------|-----------|
| AEO | Answer Engine Optimization — optimizing content so AI tools mention your brand |
| Visibility Score | 0–100 score = (prompts that mention brand / total prompts) × 100 |
| Audit | One run of 10 prompts through GPT-4o for a given workspace |
| Workspace | One brand. Users can have multiple workspaces for multiple brands. |
| Prompt | A natural-language question simulating what users ask ChatGPT about the brand's category |
| Awareness | Early-stage query: 'What is [category]?' |
| Consideration | Mid-stage query: 'What are the best [solutions] for [problem]?' |
| Decision | Late-stage query: 'Which [product] should I choose for [specific need]?' |
| Credit | The unit of currency in Nuave — 1 credit ≈ one action/generation |
| Auth gate | The login/signup wall placed between form submission and audit start |
| Reveal Fix | Paid action (1 credit) that generates suggested copy for a recommendation |
| PGRST204 | PostgREST error: INSERT succeeded but SELECT returned 0 rows — usually caused by RLS blocking SELECT or schema cache mismatch |

### B. Key File Locations

| Path | Contents |
|------|---------|
| src/app/globals.css | Design tokens, card system, input styles, mobile responsive |
| src/app/page.tsx | Landing page with auth-gated form |
| src/app/auth/page.tsx | Google OAuth page |
| src/app/auth/callback/route.ts | OAuth callback + user creation |
| src/app/onboarding/analyze/page.tsx | Scrape trigger + animation |
| src/app/onboarding/profile/page.tsx | Profile review |
| src/app/onboarding/prompts/page.tsx | Prompt review + audit trigger |
| src/app/audit/[id]/running/page.tsx | Polling + animation |
| src/app/audit/[id]/results/page.tsx | Results + prompt modal |
| src/app/audit/[id]/recommendations/page.tsx | Recommendations screen |
| src/app/api/scrape/route.ts | Claude website scraping — uses randomUUID() for workspace ID |
| src/app/api/run-audit/route.ts | Background audit processing |
| src/app/api/audit/[id]/status/route.ts | Status polling endpoint |
| src/app/api/recommendations/route.ts | Free recommendation generation |
| src/app/api/recommendations/reveal/route.ts | Paid suggested copy generation |
| src/lib/supabase/server.ts | Both createClient (session-aware) AND createSupabaseAdminClient (service role) |
| src/lib/supabase/client.ts | Browser client |

### C. Supabase Project Details

| Item | Value |
|------|-------|
| Project ID | bromdpwhiyqpffqxlzcu |
| Region | Singapore (sin1) — optimal for ID/MY market |
| SQL Editor URL | https://supabase.com/dashboard/project/bromdpwhiyqpffqxlzcu/editor |
| Admin test user ID | e1a61f8f-115c-48aa-82e2-fd9123d7e21b |
| Admin credits balance | 999999 (test account) |

### D. Vercel Project Details

| Item | Value |
|------|-------|
| Project | mailyasirmukhtar-gmailcoms-projects/nuave |
| Deployments URL | https://vercel.com/mailyasirmukhtar-gmailcoms-projects/nuave/deployments |
| Logs URL | https://vercel.com/mailyasirmukhtar-gmailcoms-projects/nuave/logs |
| Production domain | nuave.id |
| Deploy trigger | Push to `main` branch on GitHub |
| GitHub repo | https://github.com/yasir-mukhtar/nuave_v0.3 |