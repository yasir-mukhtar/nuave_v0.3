import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

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

    // Fetch billing events (payment-related only)
    const { data: events, error } = await supabase
      .from('billing_events')
      .select('id, event_type, midtrans_order_id, payload, created_at')
      .eq('org_id', om.org_id)
      .in('event_type', [
        'webhook_settlement',
        'webhook_capture',
        'subscription_cancelled',
        'plan_upgrade',
        'plan_downgrade_scheduled',
      ])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    // Also fetch refund requests
    const { data: refunds } = await supabase
      .from('refund_requests')
      .select('id, amount, status, reason, created_at')
      .eq('org_id', om.org_id)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      events: events ?? [],
      refunds: refunds ?? [],
    });

  } catch (error: unknown) {
    console.error('Billing invoices error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
