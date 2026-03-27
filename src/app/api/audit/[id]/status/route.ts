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
      return NextResponse.json({ success: false, error: 'Database error while fetching audit' }, { status: 500 });
    }

    if (!audit) {
      return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });
    }

    // STEP 2 — Handle different statuses
    if (audit.status === 'running' || audit.status === 'pending') {
      // Stale audit reaper: if running for more than 10 minutes, mark as failed
      const createdAt = new Date(audit.created_at).getTime();
      const now = Date.now();
      const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

      if (now - createdAt > STALE_THRESHOLD_MS) {
        await supabase
          .from('audits')
          .update({ status: 'failed' })
          .eq('id', id);

        return NextResponse.json({
          status: 'failed',
          audit_id: id,
          error: 'Audit timed out. Please try again.'
        });
      }

      // Count how many prompts have been processed so far
      const { count: completedPrompts } = await supabase
        .from('audit_results')
        .select('*', { count: 'exact', head: true })
        .eq('audit_id', id);

      return NextResponse.json({
        status: 'running',
        audit_id: id,
        completed_prompts: completedPrompts ?? 0,
        total_prompts: audit.total_prompts ?? 10,
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
        return NextResponse.json({ success: false, error: 'Failed to fetch audit results' }, { status: 500 });
      }

      // Fetch competitor URLs from brand_competitors
      const { data: brandCompetitors } = await supabase
        .from('brand_competitors')
        .select('name, website_url')
        .eq('brand_id', audit.brand_id);

      const competitorUrls: Record<string, string | null> = {};
      (brandCompetitors || []).forEach((c: { name: string; website_url: string | null }) => {
        competitorUrls[c.name] = c.website_url;
      });

      return NextResponse.json({
        status: 'complete',
        audit_id: audit.id,
        visibility_score: audit.visibility_score,
        brand_mention_count: audit.brand_mention_count,
        total_prompts: audit.total_prompts,
        competitor_urls: competitorUrls,
        results: (results || []).map(r => ({
          prompt_text: r.prompt_text,
          ai_response: r.ai_response,
          brand_mentioned: r.brand_mentioned,
          mention_context: r.mention_context,
          competitor_mentions: r.competitor_mentions ?? [],
          created_at: r.created_at
        }))
      });
    }

    // Fallback for unexpected status
    return NextResponse.json({
      status: audit.status,
      audit_id: id
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
