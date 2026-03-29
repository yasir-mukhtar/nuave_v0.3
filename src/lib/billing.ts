// Billing utility helpers: proration, period calculation, refund math, Midtrans helpers.

import {
  type PlanId,
  type BillingCycle,
  getPlanPricing,
  isUpgrade,
  isDowngrade,
} from './plan-limits';
import crypto from 'crypto';

// ── Period calculation ───────────────────────────────────────

export function calculatePeriodEnd(
  start: Date,
  cycle: BillingCycle
): Date {
  const end = new Date(start);
  if (cycle === 'annual') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.ceil(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Pricing helpers ──────────────────────────────────────────

/**
 * Total charge for a plan+cycle (what they actually pay).
 * Monthly: monthly price. Annual: annual_per_month × 12.
 */
export function getTotalCharge(plan: PlanId, cycle: BillingCycle): number {
  const pricing = getPlanPricing(plan);
  if (cycle === 'annual') {
    return pricing.annual * 12;
  }
  return pricing.monthly;
}

// ── Proration (upgrades) ─────────────────────────────────────

export interface ProrationResult {
  unusedCredit: number; // IDR credit from old plan's unused days
  chargeAmount: number; // IDR to charge for new plan
  netCharge: number;    // chargeAmount - unusedCredit (min 0)
}

/**
 * Calculate proration for an immediate upgrade.
 * Old plan's unused days become a credit against the new plan's first charge.
 */
export function calculateUpgradeProration(
  oldPlan: PlanId,
  oldCycle: BillingCycle,
  newPlan: PlanId,
  newCycle: BillingCycle,
  periodStart: Date,
  periodEnd: Date,
  now: Date = new Date()
): ProrationResult {
  const totalDays = daysBetween(periodStart, periodEnd);
  const usedDays = daysBetween(periodStart, now);
  const unusedDays = Math.max(totalDays - usedDays, 0);

  const oldTotalCharge = getTotalCharge(oldPlan, oldCycle);
  const unusedFraction = totalDays > 0 ? unusedDays / totalDays : 0;
  const unusedCredit = Math.round(oldTotalCharge * unusedFraction);

  const chargeAmount = getTotalCharge(newPlan, newCycle);
  const netCharge = Math.max(chargeAmount - unusedCredit, 0);

  return { unusedCredit, chargeAmount, netCharge };
}

// ── Refund calculation (annual cancellation) ─────────────────

export interface RefundResult {
  monthsUsed: number;
  monthsRemaining: number;
  refundAmount: number; // IDR
  eligible: boolean;
  reason: string;
}

/**
 * Calculate refund for subscription cancellation.
 * - Monthly: no refund (access continues until period end)
 * - Annual: refund unused full months at annual rate
 * - Within 48h of first subscription: full refund
 */
export function calculateRefund(
  plan: PlanId,
  cycle: BillingCycle,
  planStartedAt: Date,
  periodStart: Date,
  periodEnd: Date,
  now: Date = new Date()
): RefundResult {
  // 48-hour cooling-off: full refund if within 48h of first subscription
  const hoursSinceStart = (now.getTime() - planStartedAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceStart <= 48) {
    const fullCharge = getTotalCharge(plan, cycle);
    return {
      monthsUsed: 0,
      monthsRemaining: cycle === 'annual' ? 12 : 1,
      refundAmount: fullCharge,
      eligible: true,
      reason: 'Refund penuh: dalam periode 48 jam.',
    };
  }

  // Monthly: no refund
  if (cycle === 'monthly') {
    return {
      monthsUsed: 1,
      monthsRemaining: 0,
      refundAmount: 0,
      eligible: false,
      reason: 'Paket bulanan tidak dapat direfund. Akses berlanjut hingga akhir periode.',
    };
  }

  // Annual: refund unused full months at annual rate
  const monthsUsed = Math.ceil(
    (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const monthsRemaining = Math.max(12 - monthsUsed, 0);

  if (monthsRemaining === 0) {
    return {
      monthsUsed,
      monthsRemaining: 0,
      refundAmount: 0,
      eligible: false,
      reason: 'Tidak ada bulan tersisa untuk direfund.',
    };
  }

  const pricing = getPlanPricing(plan);
  const refundAmount = monthsRemaining * pricing.annual; // annual rate per month

  return {
    monthsUsed,
    monthsRemaining,
    refundAmount,
    eligible: true,
    reason: `Refund ${monthsRemaining} bulan × Rp ${pricing.annual.toLocaleString('id-ID')}/bulan.`,
  };
}

// ── Midtrans helpers ─────────────────────────────────────────

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? '';
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

export const MIDTRANS_BASE_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://api.midtrans.com'
  : 'https://api.sandbox.midtrans.com';

export const MIDTRANS_SNAP_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

function midtransAuthHeader(): string {
  return 'Basic ' + Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64');
}

/**
 * Verify Midtrans webhook signature.
 * SHA512(order_id + status_code + gross_amount + server_key)
 */
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const payload = orderId + statusCode + grossAmount + MIDTRANS_SERVER_KEY;
  const expected = crypto.createHash('sha512').update(payload).digest('hex');
  return expected === signatureKey;
}

/**
 * Create a Midtrans Snap transaction token.
 */
export async function createSnapTransaction(params: {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  planLabel: string;
  cycleLabel: string;
}): Promise<{ token: string; redirect_url: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let response: Response;
  try {
    response = await fetch(MIDTRANS_SNAP_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': midtransAuthHeader(),
      },
    body: JSON.stringify({
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount,
      },
      item_details: [
        {
          id: `nuave-${params.planLabel}-${params.cycleLabel}`,
          price: params.amount,
          quantity: 1,
          name: `Nuave ${params.planLabel} (${params.cycleLabel})`,
        },
      ],
      customer_details: {
        email: params.customerEmail,
        first_name: params.customerName,
      },
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nuave.ai'}/settings?tab=langganan`,
        error: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nuave.ai'}/harga`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nuave.ai'}/settings?tab=langganan`,
      },
    }),
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Midtrans Snap error: ${response.status} ${errorBody}`);
  }

  return response.json();
}

/**
 * Generate a unique order ID for Midtrans.
 */
export function generateOrderId(orgId: string, plan: PlanId): string {
  const timestamp = Date.now();
  const rand = crypto.randomBytes(4).toString('hex');
  return `nuave-${plan}-${orgId.slice(0, 8)}-${timestamp}-${rand}`;
}
