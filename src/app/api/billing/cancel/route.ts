import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { getOrgPlan } from '@/lib/plan-gate';
import { isPaidPlan, type BillingCycle } from '@/lib/plan-limits';
import { calculateRefund } from '@/lib/billing';

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
        { error: 'Hanya owner/admin yang dapat membatalkan langganan.' },
        { status: 403 }
      );
    }

    if (!isPaidPlan(orgPlan.plan)) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki langganan aktif.' },
        { status: 400 }
      );
    }

    const { data: orgRow } = await supabase
      .from('organizations')
      .select('billing_cycle, plan_started_at, current_period_start, current_period_end')
      .eq('id', orgPlan.orgId)
      .single();

    if (!orgRow) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const now = new Date();

    // Calculate potential refund
    const refund = calculateRefund(
      orgPlan.plan,
      (orgRow.billing_cycle || 'monthly') as BillingCycle,
      orgRow.plan_started_at ? new Date(orgRow.plan_started_at) : now,
      orgRow.current_period_start ? new Date(orgRow.current_period_start) : now,
      orgRow.current_period_end ? new Date(orgRow.current_period_end) : now,
      now
    );

    // Set cancel_at_period_end — access continues until period ends
    await supabase
      .from('organizations')
      .update({
        cancel_at_period_end: true,
        cancelled_at: now.toISOString(),
        pending_plan: 'free',
        updated_at: now.toISOString(),
      })
      .eq('id', orgPlan.orgId);

    // Log billing event
    await supabase.from('billing_events').insert({
      org_id: orgPlan.orgId,
      event_type: 'subscription_cancelled',
      payload: {
        plan: orgPlan.plan,
        effective_at: orgRow.current_period_end,
        refund_eligible: refund.eligible,
        refund_amount: refund.refundAmount,
        refund_reason: refund.reason,
      },
    });

    // If refund is eligible (48h cooling-off or annual partial), create refund request
    if (refund.eligible && refund.refundAmount > 0) {
      await supabase.from('refund_requests').insert({
        org_id: orgPlan.orgId,
        requested_by: user.id,
        reason: 'Pembatalan langganan',
        amount: refund.refundAmount,
        status: refund.monthsUsed === 0 ? 'approved' : 'pending', // Auto-approve 48h cooling-off
      });
    }

    return NextResponse.json({
      success: true,
      cancel_at_period_end: true,
      effective_at: orgRow.current_period_end,
      refund: {
        eligible: refund.eligible,
        amount: refund.refundAmount,
        reason: refund.reason,
      },
      message: `Langganan akan berakhir pada ${new Date(orgRow.current_period_end ?? '').toLocaleDateString('id-ID')}.`,
    });

  } catch (error: unknown) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
