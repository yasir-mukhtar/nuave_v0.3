import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Daily cron: handles two subscription lifecycle events:
 * 1. Downgrade execution — applies pending_plan when current_period_end has passed
 * 2. Grace period expiry — downgrades past_due orgs to Free after 14 days
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const summary = {
    downgrades_applied: 0,
    grace_period_expired: 0,
    errors: [] as string[],
  };

  // ── 1. Apply pending downgrades ────────────────────────────
  // Orgs where the billing period has ended and a downgrade is queued
  const { data: pendingDowngrades, error: pdError } = await supabase
    .from('organizations')
    .select('id, pending_plan, plan')
    .not('pending_plan', 'is', null)
    .lt('current_period_end', now);

  if (pdError) {
    summary.errors.push(`Fetch pending downgrades: ${pdError.message}`);
  } else if (pendingDowngrades) {
    for (const org of pendingDowngrades) {
      const { error } = await supabase
        .from('organizations')
        .update({
          plan: org.pending_plan,
          pending_plan: null,
          // If downgrading to free, clear subscription fields
          ...(org.pending_plan === 'free'
            ? {
                subscription_status: 'cancelled',
                cancel_at_period_end: false,
              }
            : {
                subscription_status: 'active',
              }),
          updated_at: now,
        })
        .eq('id', org.id);

      if (error) {
        summary.errors.push(`Downgrade org ${org.id}: ${error.message}`);
      } else {
        summary.downgrades_applied++;

        await supabase.from('billing_events').insert({
          org_id: org.id,
          event_type: 'downgrade_applied',
          payload: { from_plan: org.plan, to_plan: org.pending_plan },
        });
      }
    }
  }

  // ── 2. Expire past_due subscriptions after 14-day grace ────
  const graceCutoff = new Date();
  graceCutoff.setDate(graceCutoff.getDate() - 14);

  // Find orgs that have been past_due for more than 14 days
  // We check billing_events for when past_due was first set
  const { data: pastDueOrgs, error: pdoError } = await supabase
    .from('organizations')
    .select('id, plan')
    .eq('subscription_status', 'past_due')
    .lt('current_period_end', graceCutoff.toISOString());

  if (pdoError) {
    summary.errors.push(`Fetch past_due orgs: ${pdoError.message}`);
  } else if (pastDueOrgs) {
    for (const org of pastDueOrgs) {
      const { error } = await supabase
        .from('organizations')
        .update({
          plan: 'free',
          subscription_status: 'expired',
          pending_plan: null,
          cancel_at_period_end: false,
          updated_at: now,
        })
        .eq('id', org.id);

      if (error) {
        summary.errors.push(`Expire org ${org.id}: ${error.message}`);
      } else {
        summary.grace_period_expired++;

        await supabase.from('billing_events').insert({
          org_id: org.id,
          event_type: 'grace_period_expired',
          payload: { from_plan: org.plan, to_plan: 'free' },
        });
      }
    }
  }

  return NextResponse.json({ success: true, summary });
}
