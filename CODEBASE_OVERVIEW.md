# Nuave v0.3 - Codebase Overview for AI Assistants

Nuave is an AI-powered **Answer Engine Optimization (AEO)** visibility audit tool. It analyzes how modern AI engines (like ChatGPT or Perplexity) perceive and recommend a brand.

---

## 🚀 Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Frontend:** React 19, Tailwind CSS 4, Geist Sans & Inter fonts
- **Backend:** Next.js Route Handlers (API Routes)
- **Database & Auth:** Supabase (PostgreSQL, RLS enabled)
- **AI Models:** 
  - **GPT-4o:** Used for scraping, profile extraction, and prompt generation.
  - **GPT-4o-2024-11-20:** Used with `web_search_preview` tool to simulate real AI search/response behavior for audits.
- **Localization:** Fully translated to **Bahasa Indonesia**.

---

## 📂 Core Directory Structure
- `src/app/`: Next.js App Router
  - `(dashboard)/`: Layout and pages for the logged-in user dashboard.
  - `api/`: API endpoints for audits, scraping, prompts, and credits.
  - `audit/[id]/`: Audit-specific pages (running, results, recommendations).
  - `onboarding/`: User onboarding flow (profile analysis -> prompt generation).
  - `auth/`: Login and callback handlers.
- `src/components/`: Shared UI components (Sidebar, Topbar, Loaders).
- `src/hooks/`: Custom React hooks (e.g., `useCreditsBalance`).
- `src/lib/`:
  - `supabase/`: Server and admin clients for database interaction.
- `supabase/schema.sql`: Database schema definition.

---

## 📊 Data Model (Supabase)
- **users:** Profiles linked to `auth.users`. Tracks `credits_balance`.
- **workspaces:** Container for brand data (website, industry, differentiators, competitors).
- **prompts:** 10 AI-generated questions per audit. Categorized by stage: `awareness`, `consideration`, `decision`.
- **audits:** Main record for a visibility check. Tracks `status` (pending, running, complete) and `visibility_score`.
- **audit_results:** Individual AI responses for each prompt. Stores `brand_mentioned` (boolean) and `mention_context`.
- **recommendations:** AI-suggested improvements (web copy, meta, etc.) based on audit gaps.
- **credit_transactions:** Audit trail for credit usage (purchase, debit, bonus).

---

## 🛠️ Key Workflows

### 1. Onboarding & Scraping
- **Endpoint:** `/api/scrape`
- **Logic:** Fetches HTML from a URL -> GPT-4o extracts brand profile (industry, competitors, etc.).
- **Page:** `src/app/onboarding/analyze/page.tsx`

### 2. Prompt Generation
- **Endpoint:** `/api/generate-prompts`
- **Logic:** Generates 10 "problem-first" questions. 70% English, 30% local language. No mention of the brand itself allowed in prompts.

### 3. Audit Execution (AEO Simulation)
- **Endpoint:** `/api/run-audit`
- **Logic:** 
  - Starts a background process (using `waitUntil` on Edge).
  - Iterates through 10 prompts.
  - Calls OpenAI with `web_search_preview` to simulate a search-enabled AI agent.
  - Analyzes the response to see if the brand is mentioned and in what context.
- **Tracking:** Progress is tracked via `/api/audit/[id]/status`.

### 4. Credit System
- Audits cost **10 credits** (1 per prompt).
- Recommendations cost **1 credit** each.
- Blog posts (planned) cost **2 credits**.

---

## ⚠️ Important Implementation Details
- **Next.js 16 `params`:** Dynamic route parameters (e.g., `id` from `[id]`) MUST be awaited: `const { id } = await params;`.
- **Supabase Clients:** 
  - `createSupabaseServerClient`: Used for user-scoped operations (respects RLS).
  - `createSupabaseAdminClient`: Used for background tasks or system-level updates.
- **Localization:** Copy is primarily in Bahasa Indonesia.
- **UI:** Uses `@tailwindcss/postcss` (Tailwind 4) with `src/styles/tokens.css` for design system consistency.

---

## 🎯 Project Goal
Help brands understand their "visibility" in the age of AI search. If an AI doesn't mention you when a user asks a relevant question, you are invisible. Nuave audits this and tells you how to fix it.
