import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { type PlanId, getPlanLimits, getPlanPricing } from '@/lib/plan-limits';
import { getPlanLabel } from '@/lib/plan-gate-client';

export async function GET(req: NextRequest) {
  try {
    const supabaseServer = await createSupabaseServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    // Resolve org
    const { data: om } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!om?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { data: org } = await supabase
      .from('organizations')
      .select(`
        plan, billing_cycle, subscription_status,
        plan_started_at, current_period_start, current_period_end,
        cancel_at_period_end, cancelled_at, pending_plan
      `)
      .eq('id', om.org_id)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const plan = org.plan as PlanId;
    const limits = getPlanLimits(plan);
    const pricing = getPlanPricing(plan);

    // Count current usage
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('org_id', om.org_id);

    const wsIds = workspaces?.map(w => w.id) ?? [];

    let brandCount = 0;
    let contentGenerationCount = 0;

    if (wsIds.length > 0) {
      const { count: bc } = await supabase
        .from('brands')
        .select('id', { count: 'exact', head: true })
        .in('workspace_id', wsIds);
      brandCount = bc ?? 0;

      // Count content generations in current billing period
      if (org.current_period_start) {
        const { data: brands } = await supabase
          .from('brands')
          .select('id')
          .in('workspace_id', wsIds);

        const brandIds = brands?.map(b => b.id) ?? [];
        if (brandIds.length > 0) {
          const { count: cc } = await supabase
            .from('content_assets')
            .select('id', { count: 'exact', head: true })
            .in('brand_id', brandIds)
            .gte('created_at', org.current_period_start);
          contentGenerationCount = cc ?? 0;
        }
      }
    }

    return NextResponse.json({
      plan,
      plan_label: getPlanLabel(plan),
      billing_cycle: org.billing_cycle,
      subscription_status: org.subscription_status,
      plan_started_at: org.plan_started_at,
      current_period_start: org.current_period_start,
      current_period_end: org.current_period_end,
      cancel_at_period_end: org.cancel_at_period_end,
      cancelled_at: org.cancelled_at,
      pending_plan: org.pending_plan,
      pending_plan_label: org.pending_plan ? getPlanLabel(org.pending_plan as PlanId) : null,
      pricing: {
        monthly: pricing.monthly,
        annual: pricing.annual,
      },
      usage: {
        brands: { used: brandCount, limit: limits.maxBrands },
        content_generations: {
          used: contentGenerationCount,
          limit: limits.contentGenerationsPerMonth,
        },
      },
      limits,
    });

  } catch (error: unknown) {
    console.error('Billing status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
