// =============================================================
// Nuave Types — v3 schema
// Hierarchy: organizations → workspaces → brands → (topics, prompts, audits, recommendations, content_assets)
// =============================================================

// ── Auth / Identity ───────────────────────────────────────────
export type User = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

// ── Organizations ─────────────────────────────────────────────
export type OrgPlan = 'free' | 'pro' | 'enterprise';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: OrgPlan;
  credits_balance: number;
  created_at: string;
  updated_at: string;
};

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export type OrganizationMember = {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  invited_by: string | null;
  created_at: string;
};

// ── Workspaces ────────────────────────────────────────────────
export type Workspace = {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceRole = 'admin' | 'member' | 'viewer';

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
};

// ── Brands ────────────────────────────────────────────────────
export type Brand = {
  id: string;
  workspace_id: string;
  created_by: string | null;
  name: string;
  website_url: string | null;
  language: string;
  company_overview: string | null;
  differentiators: string[];
  industry: string | null;
  target_audience: string | null;
  onboarding_completed_at: string | null; // gates free credit claim
  monitoring_enabled: boolean;
  monitoring_paused_at: string | null;
  created_at: string;
  updated_at: string;
};

// ── Topics ────────────────────────────────────────────────────
export type Topic = {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
};

// ── Prompts ───────────────────────────────────────────────────
export type PromptStage = 'awareness' | 'consideration' | 'decision';
export type DemandTier = 'high' | 'medium' | 'low';

export type Prompt = {
  id: string;
  brand_id: string;
  topic_id: string | null; // null = uncategorized
  prompt_text: string;
  stage: PromptStage | null;
  language: string;
  is_active: boolean;
  is_edited: boolean;
  display_order: number;
  core_keyword: string | null;
  demand_tier: DemandTier;
  search_volume: number | null;
  search_volume_range: string | null;
  competition_level: string | null;
  cpc_micros: number | null;
  keyword_data_fetched_at: string | null;
  archived_at: string | null;
  created_at: string;
};

// ── Brand Competitors ─────────────────────────────────────────
export type BrandCompetitor = {
  id: string;
  brand_id: string;
  name: string;
  website_url: string | null;
  notes: string | null;
  created_at: string;
};

// ── Audits ────────────────────────────────────────────────────
export type AuditStatus = 'pending' | 'running' | 'complete' | 'failed';

export type Audit = {
  id: string;
  brand_id: string;
  created_by: string | null;
  status: AuditStatus;
  visibility_score: number | null; // 0.00–100.00
  total_prompts: number | null;
  brand_mention_count: number | null;
  credits_used: number;
  audit_type: 'manual' | 'monitoring';
  created_at: string;
  completed_at: string | null;
};

// ── Audit Results ─────────────────────────────────────────────
export type AuditResult = {
  id: string;
  audit_id: string;
  prompt_id: string | null;
  prompt_text: string | null;
  ai_response: string | null;
  ai_model: string | null;
  brand_mentioned: boolean;
  mention_context: string | null;
  mention_sentiment: string | null;
  competitor_mentions: string[];
  position_rank: number | null;
  created_at: string;
};

// ── Competitor Snapshots ──────────────────────────────────────
export type CompetitorSnapshot = {
  id: string;
  audit_id: string;
  competitor_id: string | null;
  competitor_name: string; // denormalized
  mention_count: number;
  mention_frequency: number | null;
  avg_position: number | null;
  created_at: string;
};

// ── Audit Problems ────────────────────────────────────────────
export type AuditProblemSeverity = 'high' | 'medium' | 'low';
export type AuditProblemStatus = 'unresolved' | 'in_progress' | 'resolved';

export type AuditProblem = {
  id: string;
  audit_id: string;
  audit_result_id: string | null;
  brand_id: string;
  problem_key: string;
  severity: AuditProblemSeverity | null;
  problem_type: string | null;
  title: string | null;
  description: string | null;
  status: AuditProblemStatus;
  first_seen_audit_id: string | null;
  last_seen_audit_id: string | null;
  resolved_at: string | null;
  created_at: string;
};

// ── Recommendations ───────────────────────────────────────────
export type RecommendationType = 'technical' | 'web_copy' | 'content';
export type RecommendationSubtype =
  | 'meta' | 'schema' | 'structure'      // technical subtypes
  | 'blog' | 'page';                      // content subtypes

export type RecommendationStatus = 'open' | 'applied' | 'dismissed' | 'resolved';
export type RecommendationPriority = 'high' | 'medium' | 'low';

export type Recommendation = {
  id: string;
  brand_id: string;
  source_audit_id: string | null;      // audit that first identified this gap
  last_seen_audit_id: string | null;   // most recent audit where gap is still present
  type: RecommendationType | null;
  subtype: RecommendationSubtype | null;
  priority: RecommendationPriority | null;
  title: string;
  description: string | null;
  page_target: string | null;
  suggested_copy: string | null;
  problem_id: string | null;
  status: RecommendationStatus;
  applied_at: string | null;
  resolved_at: string | null;
  dismissed_at: string | null;
  credits_used: number;
  created_at: string;
  updated_at: string;
};

// ── Audit Problem + Recommendation Composites ────────────────
export type AuditProblemWithRecs = AuditProblem & {
  recommendations: Recommendation[];
};

export type ProblemExtractionResult = {
  problems_found: number;
  audit_id: string;
};

export type GenerateForProblemResult = {
  recommendations_generated: number;
  problem_id: string;
};

export type RecheckResult = {
  resolved: 'yes' | 'partial' | 'no';
  explanation: string;
  problem_id: string;
  new_status: 'resolved' | 'in_progress' | 'unresolved';
};

// ── Content Assets ────────────────────────────────────────────
export type ContentAssetType = 'blog_post' | 'page_copy' | 'meta_description' | 'schema_markup';
export type ContentAssetStatus = 'draft' | 'published' | 'indexed';

export type ContentAsset = {
  id: string;
  brand_id: string;
  origin_recommendation_id: string | null;
  created_by: string | null;
  type: ContentAssetType;
  title: string | null;
  slug: string | null;
  content: string | null;
  meta_description: string | null;
  target_query: string | null;
  status: ContentAssetStatus;
  published_url: string | null;
  credits_used: number;
  created_at: string;
  updated_at: string;
};

// ── Credit Transactions ───────────────────────────────────────
export type CreditTransactionType = 'purchase' | 'deduction' | 'bonus' | 'refund';

export type CreditTransaction = {
  id: string;
  org_id: string;
  actioned_by: string | null;
  audit_id: string | null;
  type: CreditTransactionType;
  amount: number;
  balance_after: number | null;
  description: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
};

// ── Composite / Join helpers ──────────────────────────────────
// Workspace with its org membership info (used in useActiveWorkspace)
export type WorkspaceWithOrg = Workspace & {
  organizations: Pick<Organization, 'id' | 'name' | 'plan' | 'credits_balance'>;
};
