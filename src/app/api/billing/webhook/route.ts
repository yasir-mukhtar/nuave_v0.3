import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { verifyMidtransSignature, calculatePeriodEnd } from '@/lib/billing';
import { type PlanId, type BillingCycle } from '@/lib/plan-limits';

export async function POST(req: NextRequest) {
  try {
    // Guard against oversized payloads (max 64KB, Midtrans payloads are ~2KB)
    const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10);
    if (contentLength > 65536) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const body = await req.json();
    const {
      order_id,
      transaction_id,
      transaction_status,
      fraud_status,
      status_code,
      gross_amount,
      signature_key,
    } = body;

    // ── Verify signature ─────────────────────────────────────
    if (!verifyMidtransSignature(order_id, status_code, gross_amount, signature_key)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const supabase = createSupabaseAdminClient();

    // ── Idempotency: check if this transaction was already processed
    const { data: existingEvent } = await supabase
      .from('billing_events')
      .select('id')
      .eq('midtrans_transaction_id', transaction_id)
      .eq('event_type', `webhook_${transaction_status}`)
      .limit(1)
      .maybeSingle();

    if (existingEvent) {
      return NextResponse.json({ status: 'already_processed' });
    }

    // ── Find the org from the order_id via billing_events ────
    // Check both subscription_created and plan_upgrade events (upgrades use a different event type)
    const { data: originalEvent } = await supabase
      .from('billing_events')
      .select('org_id, payload')
      .eq('midtrans_order_id', order_id)
      .in('event_type', ['subscription_created', 'plan_upgrade'])
      .limit(1)
      .maybeSingle();

    if (!originalEvent?.org_id) {
      console.error('Webhook: no matching billing event for order', order_id);
      // Still return 200 to prevent Midtrans retries
      return NextResponse.json({ status: 'no_matching_order' });
    }

    const orgId = originalEvent.org_id;
    const rawPayload = originalEvent.payload as Record<string, unknown>;
    // Normalize: subscription_created uses `plan`, plan_upgrade uses `to_plan`
    const payload = {
      plan: (rawPayload.plan ?? rawPayload.to_plan) as PlanId,
      cycle: (rawPayload.cycle ?? 'monthly') as BillingCycle,
      amount: rawPayload.amount as number,
    };

    // ── Log webhook event ────────────────────────────────────
    await supabase.from('billing_events').insert({
      org_id: orgId,
      event_type: `webhook_${transaction_status}`,
      midtrans_order_id: order_id,
      midtrans_transaction_id: transaction_id,
      payload: body,
      processed_at: new Date().toISOString(),
    });

    // ── Handle transaction status ────────────────────────────
    const isSuccessful =
      transaction_status === 'capture' ||
      transaction_status === 'settlement';
    const isFraudOk = !fraud_status || fraud_status === 'accept';

    if (isSuccessful && isFraudOk) {
      // Payment successful — activate subscription
      const now = new Date();
      const periodEnd = calculatePeriodEnd(now, payload.cycle);

      await supabase
        .from('organizations')
        .update({
          plan: payload.plan,
          subscription_id: transaction_id,
          billing_cycle: payload.cycle,
          plan_started_at: now.toISOString(),
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          subscription_status: 'active',
          cancel_at_period_end: false,
          cancelled_at: null,
          pending_plan: null,
          updated_at: now.toISOString(),
        })
        .eq('id', orgId);

    } else if (transaction_status === 'pending') {
      // Payment pending — keep current state, just log
      // Midtrans will send another notification when settled

    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire'
    ) {
      // Payment failed
      // Check if this is a renewal failure (org already has active subscription)
      const { data: org } = await supabase
        .from('organizations')
        .select('subscription_status, plan')
        .eq('id', orgId)
        .single();

      if (org && org.plan !== 'free' && org.subscription_status === 'active') {
        // Renewal failure — set to past_due (grace period starts)
        await supabase
          .from('organizations')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orgId);
      }
      // If it's a new subscription attempt that failed, do nothing (they stay on current plan)
    }

    // Midtrans expects 200 OK
    return NextResponse.json({ status: 'ok' });

  } catch (error: unknown) {
    console.error('Billing webhook error:', error);
    // Return 500 so Midtrans retries — only suppress known-benign failures
    return NextResponse.json(
      { status: 'error', message: 'Internal error' },
      { status: 500 }
    );
  }
}
