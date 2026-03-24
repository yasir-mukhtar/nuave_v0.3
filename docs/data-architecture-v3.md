# Nuave — Data Architecture v3
**Status:** Approved · Ready for Implementation
**Replaces:** `supabase/schema.sql` (v2)
**Date:** 2026-03-24

---

## Table of Contents
1. [Design Principles](#1-design-principles)
2. [Full Hierarchy](#2-full-hierarchy)
3. [Schema — All Tables](#3-schema--all-tables)
4. [Relationships & Constraints](#4-relationships--constraints)
5. [RLS Strategy](#5-rls-strategy)
6. [Postgres Functions](#6-postgres-functions)
7. [What Changed from v2 — Impact Analysis](#7-what-changed-from-v2--impact-analysis)
8. [Migration Phases](#8-migration-phases)
9. [Open Questions](#9-open-questions)

---

## 1. Design Principles

| Principle | What it means in practice |
|---|---|
| **One schema, two experiences** | Full enterprise hierarchy lives in the DB from day one. The UI reveals layers progressively based on plan and context. |
| **Org owns everything** | Billing, credits, and membership root at `organizations`. Nothing is owned by a raw `user_id` at the business-entity level. |
| **Audit is an event, not a container** | `audits` are time-series snapshots. Recommendations and competitors are brand-level entities that exist independently of any single audit. |
| **Domain language in the schema** | `brands` not `projects`. `topics` not JSONB. `brand_competitors` not `TEXT[]`. Schema reads like the product. |
| **No orphaned data** | All FKs cascade correctly. Deleting a brand removes everything under it. Deleting a workspace removes its brands. |
| **Credits at org scope** | A shared credit pool at the org level. Every deduction records who triggered it (`actioned_by`) for enterprise auditability. |

---

## 2. Full Hierarchy

```
organizations                    ← billing root, credit pool
  ├── organization_members       ← user accounts + org-level roles
  └── workspaces                 ← team boundaries (1 auto-created for SME)
        ├── workspace_members    ← assigns org members to workspace with scoped role
        └── brands               ← was: projects
              ├── topics         ← was: projects.topics JSONB
              │     └── prompts  ← was: prompts.topic TEXT
              ├── brand_competitors  ← was: projects.competitors TEXT[]
              ├── audits         ← time-series measurement events
              │     ├── audit_results
              │     └── competitor_snapshots  ← was: competitor_analysis
              ├── recommendations    ← brand-level persistent backlog
              └── content_assets    ← was: blog_posts (broader type system)

users                            ← mirrors auth.users, no credits_balance here
credit_transactions              ← org-scoped ledger, records actioned_by
```

---

## 3. Schema — All Tables

> Column annotations: `PK` primary key · `FK` foreign key · `NN` not null · `DEF` has default

---

### 3.1 `users`

Mirrors `auth.users`. Profile data only — no credits here (moved to org).

```sql
CREATE TABLE public.users (
  id           UUID        PK   REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  full_name    TEXT,
  avatar_url   TEXT,                          -- NEW: for team member avatars
  created_at   TIMESTAMPTZ DEF  now(),
  updated_at   TIMESTAMPTZ DEF  now()
);
```

**Removed from v2:** `credits_balance` → moved to `organizations.credits_balance`

---

### 3.2 `organizations`

Billing root. One per company. Auto-created on signup for SME users (named after the user, renameable on upgrade).

```sql
CREATE TABLE public.organizations (
  id               UUID        PK   DEFAULT gen_random_uuid(),
  name             TEXT        NN,                         -- "Budi's Account" → "Acme Corp"
  slug             TEXT        NN   UNIQUE,
  plan             TEXT        DEF  'free',                -- free | pro | enterprise
  credits_balance  INTEGER     DEF  0,                     -- shared pool (was: users.credits_balance)
  created_at       TIMESTAMPTZ DEF  now(),
  updated_at       TIMESTAMPTZ DEF  now()
);
```

**Plan values:** `free` · `pro` · `enterprise`

---

### 3.3 `organization_members`

Org-level RBAC. One record per user per org. A user can belong to multiple orgs (agency scenario: freelancer works across multiple client orgs).

```sql
CREATE TABLE public.organization_members (
  id          UUID        PK   DEFAULT gen_random_uuid(),
  org_id      UUID        NN   FK → organizations(id) ON DELETE CASCADE,
  user_id     UUID        NN   FK → users(id)         ON DELETE CASCADE,
  role        TEXT        NN   DEF 'member',           -- owner | admin | member | viewer
  invited_by  UUID             FK → users(id),         -- NULL if self-signup
  created_at  TIMESTAMPTZ DEF  now(),

  UNIQUE (org_id, user_id)
);
```

**Role hierarchy (highest → lowest):** `owner` → `admin` → `member` → `viewer`
**Rules:**
- Every org must have exactly one `owner`
- `owner` role cannot be changed via UI — requires a dedicated ownership transfer flow
- Deleting an `owner` member record is blocked unless another owner exists

---

### 3.4 `workspaces`

Team boundary within an org. Auto-created as `"default"` for SME users. Renameable. Enterprise orgs create multiple (e.g. "Brand Team", "Agency Clients").

```sql
CREATE TABLE public.workspaces (
  id          UUID        PK   DEFAULT gen_random_uuid(),
  org_id      UUID        NN   FK → organizations(id) ON DELETE CASCADE,  -- NEW (was: user_id)
  name        TEXT        NN,
  slug        TEXT        NN,
  created_at  TIMESTAMPTZ DEF  now(),
  updated_at  TIMESTAMPTZ DEF  now(),

  UNIQUE (org_id, slug)
);
```

**Removed from v2:** `user_id` (replaced by `org_id`) · `plan` (moved to `organizations.plan`)

---

### 3.5 `workspace_members`

Maps org members into specific workspaces with a workspace-scoped role. **Does not create new users** — `user_id` must already exist in `organization_members` for the same org.

```sql
CREATE TABLE public.workspace_members (
  id            UUID        PK   DEFAULT gen_random_uuid(),
  workspace_id  UUID        NN   FK → workspaces(id)          ON DELETE CASCADE,
  user_id       UUID        NN   FK → users(id)               ON DELETE CASCADE,
  role          TEXT        NN   DEF 'member',                 -- admin | member | viewer
  created_at    TIMESTAMPTZ DEF  now(),

  UNIQUE (workspace_id, user_id)
);
```

**Note:** `workspace_members.role` can differ from `organization_members.role`. Org `admin` always overrides workspace role. A DB function `effective_role(user_id, workspace_id)` should resolve the higher of the two for permission checks.

---

### 3.6 `brands`

Renamed from `projects`. One brand being tracked. Holds profile data — all config that doesn't change per audit.

```sql
CREATE TABLE public.brands (
  id               UUID        PK   DEFAULT gen_random_uuid(),
  workspace_id     UUID        NN   FK → workspaces(id) ON DELETE CASCADE,
  created_by       UUID             FK → users(id) ON DELETE SET NULL,   -- was: user_id
  name             TEXT        NN,
  website_url      TEXT,
  language         TEXT        DEF  'id',
  company_overview TEXT,
  differentiators  TEXT[],
  industry         TEXT,
  target_audience  TEXT,
  onboarding_completed_at  TIMESTAMPTZ,                -- NEW: claim gate (replaces auto-credit logic)
  created_at       TIMESTAMPTZ DEF  now(),
  updated_at       TIMESTAMPTZ DEF  now()
);
```

**Removed from v2:** `competitors TEXT[]` → own table `brand_competitors`
**Removed from v2:** `topics JSONB` → own table `topics`
**Renamed:** `user_id` → `created_by` (semantically accurate — tracks who created it, not who owns it)
**Added:** `onboarding_completed_at` — set when user completes brand profile setup; gates the free credit claim

---

### 3.7 `topics`

Extracted from `projects.topics JSONB`. A brand can have multiple topics that group its prompts. Topics are the content strategy pillars (e.g. "SEO tools", "AI content management").

```sql
CREATE TABLE public.topics (
  id             UUID        PK   DEFAULT gen_random_uuid(),
  brand_id       UUID        NN   FK → brands(id) ON DELETE CASCADE,
  name           TEXT        NN,
  description    TEXT,
  display_order  INTEGER     DEF  0,
  created_at     TIMESTAMPTZ DEF  now(),

  UNIQUE (brand_id, name)
);
```

---

### 3.8 `prompts`

Questions that are run against AI models during an audit. Each prompt belongs to a topic and a brand.

```sql
CREATE TABLE public.prompts (
  id               UUID        PK   DEFAULT gen_random_uuid(),
  brand_id         UUID        NN   FK → brands(id)  ON DELETE CASCADE,   -- was: project_id
  topic_id         UUID             FK → topics(id)  ON DELETE SET NULL,  -- was: topic TEXT
  text             TEXT        NN,                                         -- was: prompt_text
  stage            TEXT,                   -- awareness | consideration | decision
  language         TEXT        DEF  'id',
  is_active        BOOLEAN     DEF  true,
  is_edited        BOOLEAN     DEF  false,
  display_order    INTEGER     DEF  0,
  core_keyword     TEXT,
  demand_tier      TEXT        DEF  'medium',
  search_volume    INTEGER,
  search_volume_range  TEXT,
  competition_level    TEXT,
  cpc_micros       BIGINT,
  keyword_data_fetched_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEF  now()
);
```

**Renamed:** `project_id` → `brand_id` · `prompt_text` → `text` · `topic TEXT` → `topic_id UUID`

---

### 3.9 `brand_competitors`

Extracted from `projects.competitors TEXT[]`. A brand's known competitors — referenced by FK in `competitor_snapshots` instead of loose text matching.

```sql
CREATE TABLE public.brand_competitors (
  id          UUID        PK   DEFAULT gen_random_uuid(),
  brand_id    UUID        NN   FK → brands(id) ON DELETE CASCADE,
  name        TEXT        NN,
  website_url TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEF  now(),

  UNIQUE (brand_id, name)
);
```

---

### 3.10 `audits`

A measurement event. Captures brand visibility at a point in time by running all active prompts through AI models.

```sql
CREATE TABLE public.audits (
  id               UUID        PK   DEFAULT gen_random_uuid(),
  brand_id         UUID        NN   FK → brands(id) ON DELETE CASCADE,   -- was: project_id
  created_by       UUID             FK → users(id)  ON DELETE SET NULL,  -- NEW: who triggered
  status           TEXT        DEF  'pending',   -- pending | running | complete | failed
  visibility_score NUMERIC(5,2),                 -- 0.00–100.00 (was: INTEGER)
  total_prompts    INTEGER,
  brand_mention_count  INTEGER,
  credits_used     INTEGER     DEF  0,
  created_at       TIMESTAMPTZ DEF  now(),
  completed_at     TIMESTAMPTZ
);
```

**Renamed:** `project_id` → `brand_id`
**Changed:** `visibility_score INTEGER` → `NUMERIC(5,2)` for decimal precision
**Added:** `created_by` — for enterprise audit logs ("who ran this audit")

---

### 3.11 `audit_results`

Per-prompt results from a single audit run. Denormalizes `prompt_text` for historical accuracy (prompt may be edited after the audit ran).

```sql
CREATE TABLE public.audit_results (
  id                  UUID        PK   DEFAULT gen_random_uuid(),
  audit_id            UUID        NN   FK → audits(id)  ON DELETE CASCADE,
  prompt_id           UUID             FK → prompts(id) ON DELETE SET NULL,
  prompt_text         TEXT,                      -- denormalized snapshot at time of audit
  ai_response         TEXT,
  ai_model            TEXT,                      -- which model produced this result
  brand_mentioned     BOOLEAN     DEF  false,
  mention_context     TEXT,
  mention_sentiment   TEXT,                      -- positive | neutral | negative
  competitor_mentions TEXT[],
  position_rank       INTEGER,
  created_at          TIMESTAMPTZ DEF  now()
);
```

---

### 3.12 `competitor_snapshots`

Renamed from `competitor_analysis`. Per-audit competitor performance data. Now uses a proper FK to `brand_competitors` instead of loose `competitor_name TEXT`.

```sql
CREATE TABLE public.competitor_snapshots (
  id              UUID        PK   DEFAULT gen_random_uuid(),
  audit_id        UUID        NN   FK → audits(id)           ON DELETE CASCADE,
  competitor_id   UUID        NN   FK → brand_competitors(id) ON DELETE CASCADE,  -- was: competitor_name TEXT
  mention_count   INTEGER     DEF  0,
  mention_frequency  NUMERIC(5,4),
  avg_position    NUMERIC(5,2),
  created_at      TIMESTAMPTZ DEF  now()
);
```

**Renamed:** `competitor_analysis` → `competitor_snapshots`
**Changed:** `competitor_name TEXT` → `competitor_id UUID FK` — no more loose text matching; join to `brand_competitors` for the name

---

### 3.13 `recommendations`

**Key change from v2:** Recommendations are now **brand-level**, not audit-level. They form a persistent backlog that persists and evolves across audits. An audit surfaces new recommendations or confirms existing ones are still relevant.

```sql
CREATE TABLE public.recommendations (
  id                   UUID        PK   DEFAULT gen_random_uuid(),
  brand_id             UUID        NN   FK → brands(id) ON DELETE CASCADE,   -- was: audit_id
  source_audit_id      UUID             FK → audits(id) ON DELETE SET NULL,  -- NEW: first audit to find this gap
  last_seen_audit_id   UUID             FK → audits(id) ON DELETE SET NULL,  -- NEW: still present in latest audit?
  type                 TEXT,       -- technical | web_copy | content
  subtype              TEXT,       -- NEW: technical→(meta|schema|structure) | content→(blog|page)
  priority             TEXT,       -- high | medium | low
  title                TEXT        NN,
  description          TEXT,
  page_target          TEXT,
  suggested_copy       TEXT,
  status               TEXT        DEF  'open',   -- open | applied | dismissed | resolved
                                                  -- was: is_applied BOOLEAN
  applied_at           TIMESTAMPTZ,               -- NEW
  resolved_at          TIMESTAMPTZ,               -- NEW
  dismissed_at         TIMESTAMPTZ,               -- NEW
  credits_used         INTEGER     DEF  0,
  created_at           TIMESTAMPTZ DEF  now(),
  updated_at           TIMESTAMPTZ DEF  now()
);
```

**Removed:** `audit_id` as owning FK (now `brand_id` is the owner)
**Added:** `source_audit_id` · `last_seen_audit_id` · `subtype` · `status` (replaces `is_applied BOOLEAN`) · `applied_at` · `resolved_at` · `dismissed_at`

**Status lifecycle:**
```
open → applied   (user implemented the recommendation)
open → dismissed (user chose to ignore it)
applied → resolved (next audit confirms the gap is closed → score improved)
resolved → open  (regression: gap reappears in a later audit)
```

---

### 3.14 `content_assets`

Renamed and expanded from `blog_posts`. First-class content deliverable. References a recommendation as its origin but lives independently with its own lifecycle.

```sql
CREATE TABLE public.content_assets (
  id                       UUID        PK   DEFAULT gen_random_uuid(),
  brand_id                 UUID        NN   FK → brands(id)          ON DELETE CASCADE,
  origin_recommendation_id UUID             FK → recommendations(id) ON DELETE SET NULL,  -- NEW (was: audit_id+recommendation_id)
  created_by               UUID             FK → users(id)           ON DELETE SET NULL,
  type                     TEXT        NN,  -- blog_post | page_copy | meta_description | schema_markup
  title                    TEXT,
  slug                     TEXT,
  content                  TEXT,
  meta_description         TEXT,
  target_query             TEXT,
  status                   TEXT        DEF  'draft',  -- draft | published | indexed
  published_url            TEXT,                      -- NEW: track if AI picked it up
  credits_used             INTEGER     DEF  0,
  created_at               TIMESTAMPTZ DEF  now(),
  updated_at               TIMESTAMPTZ DEF  now()
);
```

**Renamed:** `blog_posts` → `content_assets`
**Removed:** `audit_id` FK (now orphan-safe: only `origin_recommendation_id` needed)
**Removed:** `project_id` → `brand_id`
**Added:** `type` enum · `status` lifecycle · `published_url` · `created_by`

---

### 3.15 `credit_transactions`

Org-scoped ledger. Records every credit movement with who triggered it — enabling enterprise usage reports ("who spent what, on which brand").

```sql
CREATE TABLE public.credit_transactions (
  id                       UUID        PK   DEFAULT gen_random_uuid(),
  org_id                   UUID        NN   FK → organizations(id) ON DELETE CASCADE,  -- NEW
  actioned_by              UUID             FK → users(id) ON DELETE SET NULL,         -- was: user_id
  audit_id                 UUID             FK → audits(id) ON DELETE SET NULL,        -- NEW: which audit consumed
  type                     TEXT        NN,  -- purchase | deduction | bonus | refund
  amount                   INTEGER     NN,  -- positive = credit, negative = debit
  balance_after            INTEGER,
  description              TEXT,
  stripe_payment_intent_id TEXT,
  created_at               TIMESTAMPTZ DEF  now()
);
```

**Renamed:** `user_id` → `actioned_by`
**Added:** `org_id` · `audit_id`

---

## 4. Relationships & Constraints

```
users ──────────────────────────────────────────────── (identity only)
  │
  ├── organization_members.user_id (N orgs per user)
  └── workspace_members.user_id   (N workspaces per user)

organizations
  ├── organization_members   (1:N)
  ├── workspaces             (1:N)
  └── credit_transactions    (1:N)

workspaces
  ├── workspace_members      (1:N)
  └── brands                 (1:N)

brands
  ├── topics                 (1:N)
  │     └── prompts          (1:N, via topic_id)
  ├── brand_competitors      (1:N)
  ├── audits                 (1:N)
  │     ├── audit_results    (1:N)
  │     └── competitor_snapshots  (1:N, via competitor_id FK → brand_competitors)
  ├── recommendations        (1:N, brand_id owner; source_audit_id and last_seen_audit_id are references only)
  └── content_assets         (1:N)

prompts
  └── audit_results.prompt_id  (soft FK, SET NULL on delete — historical results preserved)

recommendations
  └── content_assets.origin_recommendation_id  (soft FK, SET NULL — asset survives if rec is deleted)
```

### Cascade rules summary

| Delete | Cascades to |
|---|---|
| `organizations` | `organization_members`, `workspaces`, `credit_transactions` |
| `workspaces` | `workspace_members`, `brands` |
| `brands` | `topics`, `prompts`, `brand_competitors`, `audits`, `recommendations`, `content_assets` |
| `topics` | `prompts` (SET NULL on `topic_id` — prompt survives, loses topic) |
| `audits` | `audit_results`, `competitor_snapshots` |
| `brand_competitors` | `competitor_snapshots` |
| `prompts` | SET NULL on `audit_results.prompt_id` (historical result preserved) |
| `recommendations` | SET NULL on `content_assets.origin_recommendation_id` |

---

## 5. RLS Strategy

### The core RLS pattern

In v2, every policy traversed a chain: `audit → project → workspace → user_id = auth.uid()`. This works but becomes expensive at depth. In v3 the chain is longer (org → workspace → brand → ...).

**Solution: helper functions in Postgres, called once per query.**

```sql
-- Returns true if the calling user is a member of the org that owns this workspace
CREATE OR REPLACE FUNCTION is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM workspace_members wm
    JOIN workspaces w ON w.id = wm.workspace_id
    JOIN organization_members om ON om.org_id = w.org_id AND om.user_id = auth.uid()
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns the effective role for a user in a workspace
-- (higher of org role vs workspace role)
CREATE OR REPLACE FUNCTION effective_role(p_workspace_id UUID)
RETURNS TEXT AS $$
  SELECT CASE
    WHEN om.role IN ('owner','admin') THEN om.role   -- org admin always wins
    ELSE COALESCE(wm.role, 'viewer')
  END
  FROM workspaces w
  JOIN organization_members om ON om.org_id = w.org_id AND om.user_id = auth.uid()
  LEFT JOIN workspace_members wm ON wm.workspace_id = p_workspace_id AND wm.user_id = auth.uid()
  WHERE w.id = p_workspace_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### RLS per table

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `users` | own row | — (trigger only) | own row | — |
| `organizations` | member | — (trigger only) | owner/admin | owner only |
| `organization_members` | same org | owner/admin | owner (role changes) | owner/admin |
| `workspaces` | org member | org owner/admin | org admin | org admin |
| `workspace_members` | workspace member | workspace admin | workspace admin | workspace admin |
| `brands` | workspace member | workspace member | workspace member | workspace admin |
| `topics` | via brand | via brand | via brand | via brand admin |
| `prompts` | via brand | via brand | via brand | via brand admin |
| `brand_competitors` | via brand | via brand | via brand | via brand |
| `audits` | via brand | via brand (member+) | — (server only) | via brand admin |
| `audit_results` | via audit | — (server only) | — | — |
| `competitor_snapshots` | via audit | — (server only) | — | — |
| `recommendations` | via brand | — (server only) | via brand (status toggle) | via brand admin |
| `content_assets` | via brand | via brand | via brand | via brand |
| `credit_transactions` | org member (own) | — (function only) | — | — |

**"server only"** = inserted by service-role API routes, not direct client writes. RLS blocks direct INSERT.

---

## 6. Postgres Functions

### 6.1 `deduct_credits` (modified)

Credits now deducted from `organizations`, not `users`. Records `actioned_by` and `audit_id`.

```sql
CREATE OR REPLACE FUNCTION deduct_credits(
  p_org_id      UUID,
  p_amount      INTEGER,
  p_actioned_by UUID,
  p_audit_id    UUID    DEFAULT NULL,
  p_description TEXT    DEFAULT 'Audit credit deduction'
) RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE organizations
  SET credits_balance = credits_balance - p_amount,
      updated_at = now()
  WHERE id = p_org_id
    AND credits_balance >= p_amount
  RETURNING credits_balance INTO new_balance;

  IF NOT FOUND THEN RETURN -1; END IF;

  INSERT INTO credit_transactions
    (org_id, actioned_by, audit_id, type, amount, balance_after, description)
  VALUES
    (p_org_id, p_actioned_by, p_audit_id, 'deduction', -p_amount, new_balance, p_description);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.2 `refund_credits` (modified)

```sql
CREATE OR REPLACE FUNCTION refund_credits(
  p_org_id      UUID,
  p_amount      INTEGER,
  p_actioned_by UUID,
  p_audit_id    UUID    DEFAULT NULL,
  p_description TEXT    DEFAULT 'Audit failure refund'
) RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE organizations
  SET credits_balance = credits_balance + p_amount,
      updated_at = now()
  WHERE id = p_org_id
  RETURNING credits_balance INTO new_balance;

  IF NOT FOUND THEN RETURN -1; END IF;

  INSERT INTO credit_transactions
    (org_id, actioned_by, audit_id, type, amount, balance_after, description)
  VALUES
    (p_org_id, p_actioned_by, p_audit_id, 'refund', p_amount, new_balance, p_description);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.3 `handle_new_user` (modified)

On signup: create `user` record → create `organization` → create default `workspace` → add `organization_member` (owner) → add `workspace_member` (admin). All atomic.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_org_id  UUID := gen_random_uuid();
  new_ws_id   UUID := gen_random_uuid();
  user_name   TEXT := NEW.raw_user_meta_data->>'full_name';
  org_name    TEXT := COALESCE(user_name, split_part(NEW.email, '@', 1)) || '''s Account';
  org_slug    TEXT := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'))
                      || '-' || substring(gen_random_uuid()::text, 1, 6);
BEGIN
  -- 1. User profile
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, user_name)
  ON CONFLICT (id) DO NOTHING;

  -- 2. Organization
  INSERT INTO public.organizations (id, name, slug, plan, credits_balance)
  VALUES (new_org_id, org_name, org_slug, 'free', 0);

  -- 3. Default workspace
  INSERT INTO public.workspaces (id, org_id, name, slug)
  VALUES (new_ws_id, new_org_id, 'My Workspace', 'default');

  -- 4. Org membership (owner)
  INSERT INTO public.organization_members (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  -- 5. Workspace membership (admin)
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_ws_id, NEW.id, 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.4 `claim_welcome_credits` (new)

Replaces auto-grant. Called by `POST /api/credits/claim-welcome` endpoint. Idempotent.

```sql
CREATE OR REPLACE FUNCTION claim_welcome_credits(
  p_org_id      UUID,
  p_actioned_by UUID
) RETURNS INTEGER AS $$
DECLARE
  already_claimed BOOLEAN;
  new_balance     INTEGER;
BEGIN
  -- Idempotency check
  SELECT EXISTS (
    SELECT 1 FROM credit_transactions
    WHERE org_id = p_org_id AND type = 'bonus' AND description = 'Welcome audit credit'
  ) INTO already_claimed;

  IF already_claimed THEN RETURN -2; END IF;  -- -2 = already claimed

  UPDATE organizations
  SET credits_balance = credits_balance + 10, updated_at = now()
  WHERE id = p_org_id
  RETURNING credits_balance INTO new_balance;

  INSERT INTO credit_transactions
    (org_id, actioned_by, type, amount, balance_after, description)
  VALUES
    (p_org_id, p_actioned_by, 'bonus', 10, new_balance, 'Welcome audit credit');

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 7. What Changed from v2 — Impact Analysis

### 7.1 Table-level changes

| v2 Table | v3 Table | Change type | Impact |
|---|---|---|---|
| `users` | `users` | Modified | Remove `credits_balance`. All credit reads/writes must change to `organizations`. |
| `workspaces` | `workspaces` | Modified | Remove `user_id`, `plan`. Add `org_id`. All workspace ownership queries change. |
| `projects` | `brands` | Renamed + modified | **High impact.** Every API route, every UI component, every TypeScript type. Rename `project_id` → `brand_id` across the codebase. |
| `prompts` | `prompts` | Modified | Rename `project_id` → `brand_id`. `topic TEXT` → `topic_id UUID FK`. |
| `audits` | `audits` | Modified | Rename `project_id` → `brand_id`. Add `created_by`. |
| `audit_results` | `audit_results` | Minimal | No breaking changes. |
| `competitor_analysis` | `competitor_snapshots` | Renamed + FK change | Data migration: `competitor_name TEXT` → `competitor_id UUID`. Requires matching names to `brand_competitors` rows first. |
| `recommendations` | `recommendations` | **Major change** | `audit_id` → `brand_id` + `source_audit_id`. `is_applied BOOLEAN` → `status TEXT`. Recommendation generation API must be rewritten. |
| `blog_posts` | `content_assets` | Renamed + expanded | `audit_id` removed. `project_id` → `brand_id`. New `type` and `status` columns. |
| `credit_transactions` | `credit_transactions` | Modified | `user_id` → `actioned_by` + new `org_id` and `audit_id` columns. Credit functions rewritten. |
| — | `organizations` | New | New signup flow. `handle_new_user` trigger creates org automatically. |
| — | `organization_members` | New | RBAC layer. Auth middleware must check membership. |
| — | `workspace_members` | New | Workspace-scoped RBAC. |
| — | `topics` | New | Extracted from `projects.topics JSONB`. Data migration needed. |
| — | `brand_competitors` | New | Extracted from `projects.competitors TEXT[]`. Data migration needed. |

### 7.2 API routes affected

| Route | Change required |
|---|---|
| `POST /api/auth/callback` | Remove credits grant. Org/workspace now created by DB trigger. |
| `POST /api/credits/claim-welcome` | New endpoint. Calls `claim_welcome_credits()`. |
| `GET/PATCH/DELETE /api/projects/[id]` | Rename to `/api/brands/[id]`. Update all column references. |
| `POST /api/generate-topics` | Write to `topics` table instead of `projects.topics JSONB`. |
| `POST /api/generate-prompts` | Update `project_id` → `brand_id`. Resolve `topic_id` from `topics` table. |
| `POST /api/generate-topic-prompts` | Same as above. |
| `POST /api/run-audit` | `project_id` → `brand_id`. Pass `org_id` to `deduct_credits`. Add `created_by`. |
| `GET /api/audit/[id]/status` | No breaking change, minor field renames. |
| `POST /api/recommendations` | **Full rewrite.** Save to brand level (`brand_id`) not audit level. Set `source_audit_id`. Upsert logic: if same recommendation type+page_target exists, update `last_seen_audit_id` rather than inserting duplicate. |
| `POST /api/recommendations/toggle-applied` | Change to `PATCH /api/recommendations/[id]/status`. Accept `status` enum instead of toggling boolean. |

### 7.3 TypeScript types affected

All types in `src/types/index.ts` need updating:
- `Project` → `Brand` (rename + field changes)
- `Workspace` (remove `plan`, remove `user_id`)
- `Recommendation` (add `brand_id`, `source_audit_id`, `status`, remove `audit_id`)
- New types: `Organization`, `OrganizationMember`, `WorkspaceMember`, `Topic`, `BrandCompetitor`, `CompetitorSnapshot`, `ContentAsset`

---

## 8. Migration Phases

This is a zero-downtime migration strategy. Each phase is independently deployable and rollback-safe.

---

### Phase 0 — Pre-migration (no schema changes)
- Audit current data: how many workspaces, projects, prompts, recommendations exist
- Back up production DB
- Set up `supabase/migrations/` folder for versioned migration files

---

### Phase 1 — Add the org layer (additive only)

**New tables:** `organizations`, `organization_members`, `workspace_members`
**Modified:** `workspaces` — add nullable `org_id` column
**Modified:** `users` — add nullable `onboarding_completed_at` (temporary, moves to brands later)

Backfill:
```sql
-- For each existing workspace, create a shadow org owned by that workspace's user
-- and link the workspace to it
INSERT INTO organizations (id, name, slug, plan, credits_balance)
SELECT gen_random_uuid(), u.full_name || '''s Account', 'user-' || w.user_id::text, 'pro', u.credits_balance
FROM workspaces w JOIN users u ON u.id = w.user_id;

-- Link workspaces to their new orgs
UPDATE workspaces w SET org_id = o.id
FROM organizations o
WHERE o.slug = 'user-' || w.user_id::text;

-- Create org + workspace memberships for existing users
INSERT INTO organization_members (org_id, user_id, role) ...
INSERT INTO workspace_members (workspace_id, user_id, role) ...
```

After backfill: add `NOT NULL` constraint on `workspaces.org_id`.

**App changes in this phase:**
- Update `handle_new_user` trigger
- Credits read/write from `organizations` (not `users`)
- New `claim_welcome_credits` endpoint

---

### Phase 2 — Rename projects → brands, extract topics & competitors

**New tables:** `brands` (copy of `projects` with renames), `topics`, `brand_competitors`

Backfill:
```sql
-- Create brands from projects
INSERT INTO brands SELECT id, workspace_id, ... FROM projects;

-- Extract topics from projects.topics JSONB
INSERT INTO topics (brand_id, name, display_order)
SELECT p.id, topic_value, ordinality
FROM projects p, jsonb_array_elements_text(p.topics) WITH ORDINALITY AS t(topic_value, ordinality)
WHERE p.topics IS NOT NULL;

-- Extract competitors from projects.competitors TEXT[]
INSERT INTO brand_competitors (brand_id, name)
SELECT id, unnest(competitors) FROM projects WHERE competitors IS NOT NULL;

-- Update prompts.topic TEXT → topic_id UUID
UPDATE prompts pr SET topic_id = t.id
FROM topics t WHERE t.brand_id = pr.project_id AND t.name = pr.topic;
```

**Keep `projects` alive** as a view aliasing `brands` during transition. Drop after all API routes updated.

---

### Phase 3 — Migrate recommendations to brand level

**High risk. Run in off-peak hours.**

```sql
-- Add brand_id column to recommendations (nullable initially)
ALTER TABLE recommendations ADD COLUMN brand_id UUID REFERENCES brands(id);
ALTER TABLE recommendations ADD COLUMN source_audit_id UUID REFERENCES audits(id);
ALTER TABLE recommendations ADD COLUMN status TEXT DEFAULT 'open';

-- Backfill brand_id via audit chain
UPDATE recommendations r
SET brand_id = a.brand_id, source_audit_id = r.audit_id,
    status = CASE WHEN r.is_applied THEN 'applied' ELSE 'open' END
FROM audits a WHERE a.id = r.audit_id;

-- After verification: add NOT NULL on brand_id, drop audit_id
```

---

### Phase 4 — Rename competitor_analysis, blog_posts

Straightforward renames with column additions. Lower risk.

```sql
-- competitor_snapshots: add competitor_id FK, backfill from brand_competitors name match
ALTER TABLE competitor_analysis ADD COLUMN competitor_id UUID REFERENCES brand_competitors(id);
UPDATE competitor_analysis ca SET competitor_id = bc.id
FROM brand_competitors bc
JOIN audits a ON a.id = ca.audit_id
WHERE bc.brand_id = a.brand_id AND bc.name = ca.competitor_name;

-- content_assets: rename blog_posts, add type/status columns
ALTER TABLE blog_posts RENAME TO content_assets;
ALTER TABLE content_assets ADD COLUMN type TEXT DEFAULT 'blog_post';
ALTER TABLE content_assets ADD COLUMN origin_recommendation_id UUID REFERENCES recommendations(id);
```

---

### Phase 5 — Cleanup

Remove deprecated columns and old compatibility shims:
- Drop `projects` view / table
- Drop `workspaces.user_id`
- Drop `recommendations.audit_id` (owning FK, now `brand_id` owns)
- Drop `recommendations.is_applied`
- Drop `users.credits_balance`
- Drop `competitor_analysis.competitor_name`
- Clean up RLS policies for removed columns
- Update all TypeScript types to final shape

---

## 9. Open Questions

These need decisions before implementation begins.

| # | Question | Decision | Notes |
|---|---|---|---|
| 1 | **Rename DB table `projects` → `brands`?** | ✅ **Rename in DB** | Clean break. No alias needed — fresh DB, zero user data. |
| 2 | **Prompts without a topic?** | ✅ **Nullable `topic_id`** | No sentinel "No Topic" row. NULL = uncategorized. UI renders these under a virtual "Uncategorized" section — label exists in frontend only, not in DB. |
| 3 | **Recommendation deduplication** | ✅ **Update `last_seen_audit_id` on existing** | Upsert key: `(brand_id, type, page_target)` using `IS NOT DISTINCT FROM` for nullable `page_target`. Logic lives in API layer (`/api/recommendations`). |
| 4 | **`is_applied` migration for existing recs** | ✅ **Not applicable** | Zero user data in old DB — clean slate. New schema uses `status TEXT` from day one. No migration needed. |
| 5 | **Multi-org users** | ✅ **Yes — one user, multiple orgs** | `organization_members` UNIQUE on `(org_id, user_id)`. Requires "active org" switcher in UI when user has multiple orgs. |
| 6 | **Shared credit pool** | ✅ **Yes — org-level pool** | All members of an org share `organizations.credits_balance`. `credit_transactions.actioned_by` tracks who spent what. |
