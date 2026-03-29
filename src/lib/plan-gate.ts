// Server-side plan enforcement helper.
// Used by API routes to check plan access before performing actions.

import { SupabaseClient } from '@supabase/supabase-js';
import {
  type PlanId,
  type PlanLimits,
  getPlanLimits,
  isPaidPlan,
} from './plan-limits';

export interface OrgPlanInfo {
  orgId: string;
  plan: PlanId;
  limits: PlanLimits;
  subscriptionStatus: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}

export interface PlanCheckResult {
  allowed: boolean;
  reason?: string; // Indonesian user-facing message
  upgradeTarget?: PlanId; // which plan unlocks this
}

/**
 * Resolve the org + plan for the current user.
 * Uses admin client to bypass RLS (for cron jobs) or user client.
 */
export async function getOrgPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<OrgPlanInfo | null> {
  const { data: om } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (!om?.org_id) return null;

  const { data: org } = await supabase
    .from('organizations')
    .select(
      'id, plan, subscription_status, current_period_start, current_period_end'
    )
    .eq('id', om.org_id)
    .single();

  if (!org) return null;

  const plan = org.plan as PlanId;

  return {
    orgId: org.id,
    plan,
    limits: getPlanLimits(plan),
    subscriptionStatus: org.subscription_status ?? 'active',
    currentPeriodStart: org.current_period_start,
    currentPeriodEnd: org.current_period_end,
  };
}

/**
 * Resolve org plan by org ID directly (for cron jobs that already know the org).
 */
export async function getOrgPlanById(
  supabase: SupabaseClient,
  orgId: string
): Promise<OrgPlanInfo | null> {
  const { data: org } = await supabase
    .from('organizations')
    .select(
      'id, plan, subscription_status, current_period_start, current_period_end'
    )
    .eq('id', orgId)
    .single();

  if (!org) return null;

  const plan = org.plan as PlanId;

  return {
    orgId: org.id,
    plan,
    limits: getPlanLimits(plan),
    subscriptionStatus: org.subscription_status ?? 'active',
    currentPeriodStart: org.current_period_start,
    currentPeriodEnd: org.current_period_end,
  };
}

// ── Action checks ──────────────────────────────────────────────────────

/**
 * Check if a Free user can run an audit (only allowed if brand has 0 completed audits).
 */
export async function checkRunAudit(
  supabase: SupabaseClient,
  info: OrgPlanInfo,
  brandId: string
): Promise<PlanCheckResult> {
  const { plan, limits } = info;

  if (plan === 'free') {
    // Free tier: allow only the initial audit
    const { count } = await supabase
      .from('audits')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('status', 'complete');

    if ((count ?? 0) > 0) {
      return {
        allowed: false,
        reason: 'Upgrade ke Starter untuk audit berkala.',
        upgradeTarget: 'starter',
      };
    }
    return { allowed: true };
  }

  if (limits.manualAuditAllowed) {
    // Agency: check daily manual audit limit
    const today = new Date().toISOString().slice(0, 10);
    const { count } = await supabase
      .from('audits')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('audit_type', 'manual')
      .gte('created_at', `${today}T00:00:00Z`);

    if ((count ?? 0) >= limits.manualAuditMaxPerDay) {
      return {
        allowed: false,
        reason: 'Batas 1 audit manual per hari per merek.',
      };
    }
    return { allowed: true };
  }

  // Starter/Growth: no manual audits (monthly auto only)
  return {
    allowed: false,
    reason: 'Audit otomatis berjalan setiap bulan. Upgrade ke Agency untuk audit manual.',
    upgradeTarget: 'agency',
  };
}

/**
 * Check if user can view/generate recommendations.
 */
export function checkRecommendations(info: OrgPlanInfo): PlanCheckResult {
  if (!info.limits.recommendationsUnlocked) {
    return {
      allowed: false,
      reason: 'Upgrade ke Starter untuk melihat rekomendasi.',
      upgradeTarget: 'starter',
    };
  }
  return { allowed: true };
}

/**
 * Check if user can recheck a problem.
 */
export function checkRecheck(info: OrgPlanInfo): PlanCheckResult {
  if (!isPaidPlan(info.plan)) {
    return {
      allowed: false,
      reason: 'Upgrade ke Starter untuk cek ulang masalah.',
      upgradeTarget: 'starter',
    };
  }
  return { allowed: true };
}

/**
 * Check brand creation limit.
 */
export async function checkCreateBrand(
  supabase: SupabaseClient,
  info: OrgPlanInfo
): Promise<PlanCheckResult> {
  // Count brands across all workspaces in this org
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('org_id', info.orgId);

  const wsIds = workspaces?.map((w) => w.id) ?? [];

  if (wsIds.length === 0) {
    return { allowed: true }; // no workspaces yet, first brand
  }

  const { count } = await supabase
    .from('brands')
    .select('id', { count: 'exact', head: true })
    .in('workspace_id', wsIds);

  if ((count ?? 0) >= info.limits.maxBrands) {
    return {
      allowed: false,
      reason: `Anda sudah mencapai batas ${info.limits.maxBrands} merek untuk paket ${info.plan}.`,
      upgradeTarget:
        info.plan === 'free'
          ? 'starter'
          : info.plan === 'starter'
            ? 'growth'
            : info.plan === 'growth'
              ? 'agency'
              : undefined,
    };
  }
  return { allowed: true };
}

/**
 * Check active prompt limit for a brand.
 */
export async function checkCreatePrompt(
  supabase: SupabaseClient,
  info: OrgPlanInfo,
  brandId: string
): Promise<PlanCheckResult> {
  const { count } = await supabase
    .from('prompts')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .is('archived_at', null);

  if ((count ?? 0) >= info.limits.maxPromptsPerBrand) {
    return {
      allowed: false,
      reason: `Batas ${info.limits.maxPromptsPerBrand} prompt aktif per merek untuk paket ${info.plan}.`,
      upgradeTarget:
        info.plan === 'free' || info.plan === 'starter'
          ? 'growth'
          : info.plan === 'growth'
            ? 'agency'
            : undefined,
    };
  }
  return { allowed: true };
}

/**
 * Check content generation monthly quota.
 */
export async function checkContentGeneration(
  supabase: SupabaseClient,
  info: OrgPlanInfo
): Promise<PlanCheckResult> {
  const limit = info.limits.contentGenerationsPerMonth;

  if (limit === 0) {
    return {
      allowed: false,
      reason: 'Upgrade ke Starter untuk membuat konten.',
      upgradeTarget: 'starter',
    };
  }

  if (limit === -1) {
    return { allowed: true }; // unlimited
  }

  // Count content_assets created in current billing period
  if (!info.currentPeriodStart) {
    return { allowed: true }; // no billing period set, allow (dev/testing)
  }

  // Join through brands → workspaces to find org's content_assets
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('org_id', info.orgId);

  const wsIds = workspaces?.map((w) => w.id) ?? [];
  if (wsIds.length === 0) return { allowed: true };

  const { data: brands } = await supabase
    .from('brands')
    .select('id')
    .in('workspace_id', wsIds);

  const brandIds = brands?.map((b) => b.id) ?? [];
  if (brandIds.length === 0) return { allowed: true };

  const { count } = await supabase
    .from('content_assets')
    .select('id', { count: 'exact', head: true })
    .in('brand_id', brandIds)
    .gte('created_at', info.currentPeriodStart);

  if ((count ?? 0) >= limit) {
    return {
      allowed: false,
      reason: `Batas generasi konten bulan ini tercapai (${count}/${limit}).`,
      upgradeTarget:
        info.plan === 'starter'
          ? 'growth'
          : info.plan === 'growth'
            ? 'agency'
            : undefined,
    };
  }
  return { allowed: true };
}

/**
 * Check if daily monitoring is allowed for this org's plan.
 */
export function checkDailyMonitoring(info: OrgPlanInfo): PlanCheckResult {
  if (!info.limits.dailyMonitoring) {
    return {
      allowed: false,
      reason: 'Upgrade ke Starter untuk monitoring harian.',
      upgradeTarget: 'starter',
    };
  }
  return { allowed: true };
}
