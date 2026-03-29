import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  type PlanId,
  type BillingCycle,
  isPaidPlan,
  isUpgrade,
  isDowngrade,
} from '@/lib/plan-limits';
import {
  calculateUpgradeProration,
  calculatePeriodEnd,
  createSnapTransaction,
  generateOrderId,
} from '@/lib/billing';
import { getOrgPlan } from '@/lib/plan-gate';
import { getPlanLabel } from '@/lib/plan-gate-client';

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createSupabaseServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = checkRateLimit(`billing:${user.id}`, 5, 60 * 60 * 1000);
    if (rl) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Coba lagi nanti.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const newPlan = body.plan as PlanId;
    const newCycle = (body.cycle || 'monthly') as BillingCycle;

    if (!newPlan) {
      return NextResponse.json({ error: 'Paket tidak valid.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const orgPlan = await getOrgPlan(supabase, user.id);

    if (!orgPlan) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Verify user is owner/admin
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', orgPlan.orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Hanya owner/admin yang dapat mengubah paket.' },
        { status: 403 }
      );
    }

    const currentPlan = orgPlan.plan;

    if (currentPlan === newPlan) {
      return NextResponse.json(
        { error: 'Anda sudah berlangganan paket ini.' },
        { status: 400 }
      );
    }

    // ── Downgrade to Free ────────────────────────────────────
    if (newPlan === 'free') {
      // Treat as cancellation — access continues until period end
      return NextResponse.json(
        { error: 'Gunakan endpoint /api/billing/cancel untuk membatalkan langganan.' },
        { status: 400 }
      );
    }

    // ── Upgrade (immediate) ──────────────────────────────────
    if (isUpgrade(currentPlan, newPlan)) {
      const periodStart = orgPlan.currentPeriodStart
        ? new Date(orgPlan.currentPeriodStart)
        : new Date();
      const periodEnd = orgPlan.currentPeriodEnd
        ? new Date(orgPlan.currentPeriodEnd)
        : new Date();

      // Get current billing cycle from DB
      const { data: orgRow } = await supabase
        .from('organizations')
        .select('billing_cycle')
        .eq('id', orgPlan.orgId)
        .single();
      const currentCycle = (orgRow?.billing_cycle || 'monthly') as BillingCycle;

      let netCharge: number;

      if (isPaidPlan(currentPlan) && orgPlan.currentPeriodStart) {
        // Prorated upgrade from paid plan
        const proration = calculateUpgradeProration(
          currentPlan,
          currentCycle,
          newPlan,
          newCycle,
          periodStart,
          periodEnd
        );
        netCharge = proration.netCharge;
      } else {
        // Upgrade from free — full charge
        const { getTotalCharge } = await import('@/lib/billing');
        netCharge = getTotalCharge(newPlan, newCycle);
      }

      if (netCharge <= 0) {
        // Rare edge case: credit exceeds new plan cost — apply directly
        const now = new Date();
        const newPeriodEnd = calculatePeriodEnd(now, newCycle);

        await supabase
          .from('organizations')
          .update({
            plan: newPlan,
            billing_cycle: newCycle,
            current_period_start: now.toISOString(),
            current_period_end: newPeriodEnd.toISOString(),
            subscription_status: 'active',
            pending_plan: null,
            updated_at: now.toISOString(),
          })
          .eq('id', orgPlan.orgId);

        return NextResponse.json({
          success: true,
          action: 'upgraded_free',
          new_plan: newPlan,
          message: 'Upgrade berhasil! Kredit dari paket sebelumnya telah diaplikasikan.',
        });
      }

      // Create Midtrans payment for the prorated amount
      const orderId = generateOrderId(orgPlan.orgId, newPlan);

      const snap = await createSnapTransaction({
        orderId,
        amount: netCharge,
        customerEmail: user.email ?? '',
        customerName: user.user_metadata?.full_name ?? user.email ?? '',
        planLabel: getPlanLabel(newPlan),
        cycleLabel: newCycle === 'annual' ? 'Tahunan' : 'Bulanan',
      });

      // Log billing event
      await supabase.from('billing_events').insert({
        org_id: orgPlan.orgId,
        event_type: 'plan_upgrade',
        midtrans_order_id: orderId,
        payload: {
          from_plan: currentPlan,
          to_plan: newPlan,
          cycle: newCycle,
          net_charge: netCharge,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'upgrade_payment_required',
        snap_token: snap.token,
        redirect_url: snap.redirect_url,
        order_id: orderId,
        amount: netCharge,
        from_plan: currentPlan,
        to_plan: newPlan,
      });
    }

    // ── Downgrade to lower paid plan (queued for period end) ──
    if (isDowngrade(currentPlan, newPlan)) {
      await supabase
        .from('organizations')
        .update({
          pending_plan: newPlan,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgPlan.orgId);

      // Log billing event
      await supabase.from('billing_events').insert({
        org_id: orgPlan.orgId,
        event_type: 'plan_downgrade_scheduled',
        payload: {
          from_plan: currentPlan,
          to_plan: newPlan,
          effective_at: orgPlan.currentPeriodEnd,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'downgrade_scheduled',
        current_plan: currentPlan,
        pending_plan: newPlan,
        effective_at: orgPlan.currentPeriodEnd,
        message: `Paket akan berubah ke ${getPlanLabel(newPlan)} pada akhir periode billing saat ini.`,
      });
    }

    return NextResponse.json({ error: 'Perubahan paket tidak valid.' }, { status: 400 });

  } catch (error: unknown) {
    console.error('Change plan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
