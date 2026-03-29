// Central source of truth for all plan limits.
// Every enforcement point (API routes, UI components) imports from here.

export type PlanId = 'free' | 'starter' | 'growth' | 'agency';

export type BillingCycle = 'monthly' | 'annual';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export interface PlanLimits {
  maxBrands: number;
  maxPromptsPerBrand: number;
  maxTrackedCompetitors: number; // -1 = unlimited
  competitorDataVisible: boolean; // rank/position/trend data
  competitorTrendComparison: boolean; // side-by-side trend chart
  recommendationsUnlocked: boolean; // full details + suggested copy
  trendChartAvailable: boolean; // own brand score over time
  contentGenerationsPerMonth: number; // 0 = none, -1 = unlimited
  pdfExport: boolean;
  whiteLabelPdf: boolean;
  dailyMonitoring: boolean;
  monthlyAutoAudit: boolean;
  manualAuditAllowed: boolean; // Agency only
  manualAuditMaxPerDay: number; // 1 for Agency, 0 for others
  initialFreeAudit: boolean; // true for Free only
}

export interface PlanPricing {
  monthly: number; // IDR
  annual: number; // IDR per month (billed annually)
}

const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxBrands: 1,
    maxPromptsPerBrand: 10,
    maxTrackedCompetitors: 0,
    competitorDataVisible: false,
    competitorTrendComparison: false,
    recommendationsUnlocked: false,
    trendChartAvailable: false,
    contentGenerationsPerMonth: 0,
    pdfExport: false,
    whiteLabelPdf: false,
    dailyMonitoring: false,
    monthlyAutoAudit: false,
    manualAuditAllowed: false,
    manualAuditMaxPerDay: 0,
    initialFreeAudit: true,
  },
  starter: {
    maxBrands: 1,
    maxPromptsPerBrand: 10,
    maxTrackedCompetitors: 3,
    competitorDataVisible: true,
    competitorTrendComparison: false,
    recommendationsUnlocked: true,
    trendChartAvailable: true,
    contentGenerationsPerMonth: 1,
    pdfExport: true,
    whiteLabelPdf: false,
    dailyMonitoring: true,
    monthlyAutoAudit: true,
    manualAuditAllowed: false,
    manualAuditMaxPerDay: 0,
    initialFreeAudit: false,
  },
  growth: {
    maxBrands: 3,
    maxPromptsPerBrand: 30,
    maxTrackedCompetitors: 10,
    competitorDataVisible: true,
    competitorTrendComparison: true,
    recommendationsUnlocked: true,
    trendChartAvailable: true,
    contentGenerationsPerMonth: 10,
    pdfExport: true,
    whiteLabelPdf: false,
    dailyMonitoring: true,
    monthlyAutoAudit: true,
    manualAuditAllowed: false,
    manualAuditMaxPerDay: 0,
    initialFreeAudit: false,
  },
  agency: {
    maxBrands: 20,
    maxPromptsPerBrand: 50,
    maxTrackedCompetitors: -1,
    competitorDataVisible: true,
    competitorTrendComparison: true,
    recommendationsUnlocked: true,
    trendChartAvailable: true,
    contentGenerationsPerMonth: -1,
    pdfExport: true,
    whiteLabelPdf: true,
    dailyMonitoring: true,
    monthlyAutoAudit: true,
    manualAuditAllowed: true,
    manualAuditMaxPerDay: 1,
    initialFreeAudit: false,
  },
};

const PLAN_PRICING: Record<PlanId, PlanPricing> = {
  free: { monthly: 0, annual: 0 },
  starter: { monthly: 149_000, annual: 119_000 },
  growth: { monthly: 499_000, annual: 399_000 },
  agency: { monthly: 2_500_000, annual: 2_000_000 },
};

// Ordered from lowest to highest — used for upgrade/downgrade comparisons
export const PLAN_HIERARCHY: PlanId[] = [
  'free',
  'starter',
  'growth',
  'agency',
];

export function getPlanLimits(plan: PlanId): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function getPlanPricing(plan: PlanId): PlanPricing {
  return PLAN_PRICING[plan];
}

export function getPlanRank(plan: PlanId): number {
  return PLAN_HIERARCHY.indexOf(plan);
}

export function isUpgrade(from: PlanId, to: PlanId): boolean {
  return getPlanRank(to) > getPlanRank(from);
}

export function isDowngrade(from: PlanId, to: PlanId): boolean {
  return getPlanRank(to) < getPlanRank(from);
}

export function isPaidPlan(plan: PlanId): boolean {
  return plan !== 'free';
}
