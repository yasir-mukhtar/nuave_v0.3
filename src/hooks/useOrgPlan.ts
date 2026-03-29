'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { OrgPlan, SubscriptionStatus } from '@/types';
import { type PlanId, type PlanLimits, getPlanLimits } from '@/lib/plan-limits';

export interface OrgPlanState {
  plan: PlanId;
  limits: PlanLimits;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  pendingPlan: PlanId | null;
  loading: boolean;
}

const DEFAULT_STATE: OrgPlanState = {
  plan: 'free',
  limits: getPlanLimits('free'),
  subscriptionStatus: 'active',
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  pendingPlan: null,
  loading: true,
};

export function useOrgPlan(): OrgPlanState {
  const [state, setState] = useState<OrgPlanState>(DEFAULT_STATE);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function fetchPlan() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }

      const { data, error } = await supabase
        .from('organization_members')
        .select(
          'organizations(plan, subscription_status, current_period_end, cancel_at_period_end, pending_plan)'
        )
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('useOrgPlan error:', error);
        setState((s) => ({ ...s, loading: false }));
        return;
      }

      const org = data?.organizations as unknown as {
        plan: PlanId;
        subscription_status: SubscriptionStatus | null;
        current_period_end: string | null;
        cancel_at_period_end: boolean | null;
        pending_plan: PlanId | null;
      } | null;

      if (org) {
        const plan = org.plan as PlanId;
        setState({
          plan,
          limits: getPlanLimits(plan),
          subscriptionStatus: (org.subscription_status as SubscriptionStatus) ?? 'active',
          currentPeriodEnd: org.current_period_end,
          cancelAtPeriodEnd: org.cancel_at_period_end ?? false,
          pendingPlan: org.pending_plan,
          loading: false,
        });
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    }

    fetchPlan();
  }, []);

  return state;
}
