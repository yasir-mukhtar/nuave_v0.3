import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // NEXT.JS 16 FIX: params must be awaited
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing ID parameter' }, { status: 400 });
    }

    // Use createSupabaseAdminClient (Service Role)
    const supabase = createSupabaseAdminClient();

    // STEP 1 — Fetch audit record from Supabase
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (auditError) {
      console.error('Error fetching audit status:', auditError);
      return NextResponse.json({ success: false, error: 'Database error while fetching audit' }, { status: 500 });
    }

    if (!audit) {
      return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });
    }

    // STEP 2 — Handle different statuses
    if (audit.status === 'running' || audit.status === 'pending') {
      return NextResponse.json({
        status: 'running',
        audit_id: id
      });
    }

    if (audit.status === 'failed') {
      return NextResponse.json({
        status: 'failed',
        audit_id: id,
        error: 'Audit failed. Please try again.'
      });
    }

    if (audit.status === 'complete') {
      // STEP 3 — Fetch results if complete
      const { data: results, error: resultsError } = await supabase
        .from('audit_results')
        .select('*')
        .eq('audit_id', id)
        .order('created_at', { ascending: true });

      if (resultsError) {
        console.error('Error fetching audit results:', resultsError);
      }

      return NextResponse.json({
        status: 'complete',
        audit_id: audit.id,
        visibility_score: audit.visibility_score,
        brand_mention_count: audit.brand_mention_count,
        total_prompts: audit.total_prompts,
        results: (results || []).map(r => ({
          prompt_text: r.prompt_text,
          ai_response: r.ai_response,
          brand_mentioned: r.brand_mentioned,
          mention_context: r.mention_context,
          created_at: r.created_at
        }))
      });
    }

    // Fallback for unexpected status
    return NextResponse.json({
      status: audit.status,
      audit_id: id
    });

  } catch (error: any) {
    console.error('Audit Status API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
