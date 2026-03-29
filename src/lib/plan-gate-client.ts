// Client-side plan check helper.
// No Supabase calls — takes plan as input. Used for UI gating (show/hide/lock).

import {
  type PlanId,
  type PlanLimits,
  getPlanLimits,
  isPaidPlan,
} from './plan-limits';

export interface ClientPlanCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeTarget?: PlanId;
}

/**
 * Check if a feature is available on the given plan.
 * Use in React components to conditionally render lock overlays or upgrade CTAs.
 */
export function canAccess(
  plan: PlanId,
  feature:
    | 'competitor_data'
    | 'competitor_trends'
    | 'recommendations'
    | 'trend_chart'
    | 'content_generation'
    | 'pdf_export'
    | 'whitelabel_pdf'
    | 'daily_monitoring'
    | 'manual_audit'
): ClientPlanCheckResult {
  const limits = getPlanLimits(plan);

  switch (feature) {
    case 'competitor_data':
      if (!limits.competitorDataVisible)
        return {
          allowed: false,
          reason: 'Upgrade ke Starter untuk melihat data kompetitor.',
          upgradeTarget: 'starter',
        };
      return { allowed: true };

    case 'competitor_trends':
      if (!limits.competitorTrendComparison)
        return {
          allowed: false,
          reason: 'Upgrade ke Growth untuk perbandingan tren kompetitor.',
          upgradeTarget: 'growth',
        };
      return { allowed: true };

    case 'recommendations':
      if (!limits.recommendationsUnlocked)
        return {
          allowed: false,
          reason: 'Upgrade ke Starter untuk melihat rekomendasi.',
          upgradeTarget: 'starter',
        };
      return { allowed: true };

    case 'trend_chart':
      if (!limits.trendChartAvailable)
        return {
          allowed: false,
          reason: 'Upgrade ke Starter untuk melihat tren skor.',
          upgradeTarget: 'starter',
        };
      return { allowed: true };

    case 'content_generation':
      if (limits.contentGenerationsPerMonth === 0)
        return {
          allowed: false,
          reason: 'Upgrade ke Starter untuk membuat konten.',
          upgradeTarget: 'starter',
        };
      return { allowed: true };

    case 'pdf_export':
      if (!limits.pdfExport)
        return {
          allowed: false,
          reason: 'Upgrade ke Starter untuk ekspor PDF.',
          upgradeTarget: 'starter',
        };
      return { allowed: true };

    case 'whitelabel_pdf':
      if (!limits.whiteLabelPdf)
        return {
          allowed: false,
          reason: 'Upgrade ke Agency untuk PDF white-label.',
          upgradeTarget: 'agency',
        };
      return { allowed: true };

    case 'daily_monitoring':
      if (!limits.dailyMonitoring)
        return {
          allowed: false,
          reason: 'Upgrade ke Starter untuk monitoring harian.',
          upgradeTarget: 'starter',
        };
      return { allowed: true };

    case 'manual_audit':
      if (!limits.manualAuditAllowed)
        return {
          allowed: false,
          reason: 'Upgrade ke Agency untuk audit manual.',
          upgradeTarget: 'agency',
        };
      return { allowed: true };

    default:
      return { allowed: true };
  }
}

/**
 * Get the display label for a plan.
 */
export function getPlanLabel(plan: PlanId): string {
  const labels: Record<PlanId, string> = {
    free: 'Gratis',
    starter: 'Starter',
    growth: 'Growth',
    agency: 'Agency',
  };
  return labels[plan];
}

/**
 * Check if the plan's subscription is in a warning state.
 */
export function getSubscriptionWarning(
  subscriptionStatus: string,
  cancelAtPeriodEnd: boolean,
  currentPeriodEnd: string | null
): string | null {
  if (subscriptionStatus === 'past_due') {
    return 'Pembayaran gagal — perbarui metode pembayaran Anda.';
  }

  if (subscriptionStatus === 'expired') {
    return 'Langganan Anda telah berakhir. Upgrade untuk melanjutkan.';
  }

  if (cancelAtPeriodEnd && currentPeriodEnd) {
    const endDate = new Date(currentPeriodEnd);
    const daysLeft = Math.ceil(
      (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 7) {
      return `Langganan berakhir dalam ${daysLeft} hari.`;
    }
  }

  return null;
}
