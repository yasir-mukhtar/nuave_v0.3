import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { type PlanId, type BillingCycle, isPaidPlan } from '@/lib/plan-limits';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  getTotalCharge,
  createSnapTransaction,
  generateOrderId,
  calculatePeriodEnd,
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

    // Rate limit: 5 billing actions per user per hour
    const rl = checkRateLimit(`billing:${user.id}`, 5, 60 * 60 * 1000);
    if (rl) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Coba lagi nanti.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const plan = body.plan as PlanId;
    const cycle = (body.cycle || 'monthly') as BillingCycle;

    if (!plan || !isPaidPlan(plan)) {
      return NextResponse.json({ error: 'Paket tidak valid.' }, { status: 400 });
    }

    if (cycle !== 'monthly' && cycle !== 'annual') {
      return NextResponse.json({ error: 'Siklus billing tidak valid.' }, { status: 400 });
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
        { error: 'Hanya owner/admin yang dapat berlangganan.' },
        { status: 403 }
      );
    }

    // Don't allow subscribing to the same plan
    if (orgPlan.plan === plan) {
      return NextResponse.json(
        { error: 'Anda sudah berlangganan paket ini.' },
        { status: 400 }
      );
    }

    const amount = getTotalCharge(plan, cycle);
    const orderId = generateOrderId(orgPlan.orgId, plan);

    // Create Midtrans Snap transaction
    const snap = await createSnapTransaction({
      orderId,
      amount,
      customerEmail: user.email ?? '',
      customerName: user.user_metadata?.full_name ?? user.email ?? '',
      planLabel: getPlanLabel(plan),
      cycleLabel: cycle === 'annual' ? 'Tahunan' : 'Bulanan',
    });

    // Log billing event (pending)
    await supabase.from('billing_events').insert({
      org_id: orgPlan.orgId,
      event_type: 'subscription_created',
      midtrans_order_id: orderId,
      payload: {
        plan,
        cycle,
        amount,
      },
    });

    return NextResponse.json({
      success: true,
      snap_token: snap.token,
      redirect_url: snap.redirect_url,
      order_id: orderId,
      amount,
    });
  } catch (error: unknown) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
