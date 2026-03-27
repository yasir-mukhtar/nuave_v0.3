import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import {
  type PromptInput,
  processPromptBatches,
  extractCompetitors,
  calculateVisibilityScore,
} from '@/lib/audit-engine';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min (Vercel Pro)

export async function GET(req: NextRequest) {
  // ── Security: validate Vercel Cron secret ──────────────────
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  // ── Fetch all brands with active monitoring ────────────────
  const { data: brands, error: brandsError } = await supabase
    .from('brands')
    .select(`
      id,
      name,
      language,
      created_by,
      workspace_id,
      workspaces!inner ( org_id )
    `)
    .eq('monitoring_enabled', true)
    .is('monitoring_paused_at', null);

  if (brandsError || !brands) {
    return NextResponse.json(
      { error: 'Failed to fetch brands', detail: brandsError?.message },
      { status: 500 }
    );
  }

  const summary = {
    brands_found: brands.length,
    brands_processed: 0,
    brands_skipped_dedup: 0,
    brands_paused_no_credits: 0,
    brands_skipped_no_prompts: 0,
    brands_failed: 0,
    audits_created: 0,
  };

  for (const brand of brands) {
    // Supabase !inner join returns a single object (not array) for 1:1 FK
    const workspace = brand.workspaces as unknown as { org_id: string } | null;
    const orgId = workspace?.org_id;
    if (!orgId) continue;

    try {
      // ── Dedup guard: skip if already monitored today ───────
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const { data: existing } = await supabase
        .from('audits')
        .select('id')
        .eq('brand_id', brand.id)
        .eq('audit_type', 'monitoring')
        .gte('created_at', todayStart.toISOString())
        .limit(1)
        .maybeSingle();

      if (existing) {
        summary.brands_skipped_dedup++;
        continue;
      }

      // ── Fetch active prompts ───────────────────────────────
      const { data: prompts } = await supabase
        .from('prompts')
        .select('id, prompt_text, stage, language')
        .eq('brand_id', brand.id)
        .eq('is_active', true)
        .is('archived_at', null);

      if (!prompts || prompts.length === 0) {
        summary.brands_skipped_no_prompts++;
        continue;
      }

      // ── Check credits ──────────────────────────────────────
      const { data: org } = await supabase
        .from('organizations')
        .select('credits_balance')
        .eq('id', orgId)
        .single();

      if (!org || org.credits_balance < prompts.length) {
        // Auto-pause: insufficient credits
        await supabase
          .from('brands')
          .update({ monitoring_paused_at: new Date().toISOString() })
          .eq('id', brand.id);
        summary.brands_paused_no_credits++;
        continue;
      }

      // ── Create monitoring audit ────────────────────────────
      const { data: audit, error: auditError } = await supabase
        .from('audits')
        .insert({
          brand_id: brand.id,
          created_by: brand.created_by,
          status: 'pending',
          total_prompts: prompts.length,
          brand_mention_count: 0,
          credits_used: prompts.length,
          audit_type: 'monitoring',
        })
        .select('id')
        .single();

      if (auditError || !audit) {
        summary.brands_failed++;
        continue;
      }

      // ── Deduct credits ─────────────────────────────────────
      const { data: newBalance } = await supabase.rpc('deduct_credits', {
        p_org_id: orgId,
        p_amount: prompts.length,
        p_actioned_by: brand.created_by,
        p_audit_id: audit.id,
        p_description: `Monitoring: ${prompts.length} prompts`,
      });

      if (newBalance === -1) {
        // Race condition: credits depleted between check and deduction
        await supabase.from('audits').update({ status: 'failed' }).eq('id', audit.id);
        await supabase
          .from('brands')
          .update({ monitoring_paused_at: new Date().toISOString() })
          .eq('id', brand.id);
        summary.brands_paused_no_credits++;
        continue;
      }

      // ── Run prompts ────────────────────────────────────────
      await supabase.from('audits').update({ status: 'running' }).eq('id', audit.id);

      const promptInputs: PromptInput[] = prompts.map(p => ({
        id: p.id,
        prompt_text: p.prompt_text,
        stage: p.stage,
        language: p.language,
      }));

      const { totalMentions } = await processPromptBatches(
        audit.id,
        promptInputs,
        brand.name,
      );

      const visibilityScore = calculateVisibilityScore(totalMentions, prompts.length);

      // ── Extract competitors (non-fatal) ────────────────────
      try {
        await extractCompetitors(audit.id);
      } catch {
        // Non-fatal
      }

      // ── Mark complete ──────────────────────────────────────
      // NOTE: Monitoring audits skip problem extraction (extractProblemsForAudit)
      await supabase
        .from('audits')
        .update({
          status: 'complete',
          brand_mention_count: totalMentions,
          visibility_score: visibilityScore,
          completed_at: new Date().toISOString(),
        })
        .eq('id', audit.id);

      summary.brands_processed++;
      summary.audits_created++;

    } catch {
      summary.brands_failed++;
    }
  }

  return NextResponse.json({ success: true, summary });
}
