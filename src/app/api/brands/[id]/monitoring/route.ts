import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: brandId } = await params;
  const supabaseServer = await createSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // Verify ownership via workspace membership
  const { data: brand } = await admin
    .from('brands')
    .select('workspace_id')
    .eq('id', brandId)
    .maybeSingle();

  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  const { data: membership } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', brand.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { enabled } = body as { enabled: boolean };

  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'Missing required field: enabled (boolean)' }, { status: 400 });
  }

  const updateData = enabled
    ? { monitoring_enabled: true, monitoring_paused_at: null }
    : { monitoring_enabled: false, monitoring_paused_at: null };

  const { data: updated, error } = await admin
    .from('brands')
    .update(updateData)
    .eq('id', brandId)
    .select('monitoring_enabled, monitoring_paused_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update monitoring' }, { status: 500 });
  }

  return NextResponse.json({ success: true, ...updated });
}
