import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import {
  type PromptInput,
  processPromptBatches,
  calculateVisibilityScore,
} from '@/lib/audit-engine';
import { extractCompetitorsForAudit } from '@/lib/competitor-extraction';
import { type PlanId, getPlanLimits } from '@/lib/plan-limits';

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
    brands_skipped_free_plan: 0,
    brands_skipped_no_prompts: 0,
    brands_failed: 0,
    audits_created: 0,
    competitor_extraction_errors: [] as string[],
  };

  // Cache org plans + status to avoid repeated lookups
  const orgPlanCache = new Map<string, { plan: PlanId; skip: boolean }>();

  for (const brand of brands) {
    // Supabase !inner join returns a single object (not array) for 1:1 FK
    const workspace = brand.workspaces as unknown as { org_id: string } | null;
    const orgId = workspace?.org_id;
    if (!orgId) continue;

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    try {
      // ── Plan check: skip free-tier and inactive orgs ────────
      let cached = orgPlanCache.get(orgId);
      if (!cached) {
        const { data: org } = await supabase
          .from('organizations')
          .select('plan, subscription_status')
          .eq('id', orgId)
          .single();

        if (!org) continue;
        const skip =
          org.subscription_status === 'expired' ||
          org.subscription_status === 'cancelled';
        cached = { plan: org.plan as PlanId, skip };
        orgPlanCache.set(orgId, cached);
      }

      if (cached.skip) {
        summary.brands_skipped_free_plan++;
        continue;
      }

      const limits = getPlanLimits(cached.plan);
      if (!limits.dailyMonitoring) {
        summary.brands_skipped_free_plan++;
        continue;
      }

      // ── Dedup: skip if already ran today ───────────────────
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

      // ── Create monitoring audit ────────────────────────────
      const { data: audit, error: auditError } = await supabase
        .from('audits')
        .insert({
          brand_id: brand.id,
          created_by: brand.created_by,
          status: 'pending',
          total_prompts: prompts.length,
          brand_mention_count: 0,
          credits_used: 0,
          audit_type: 'monitoring',
        })
        .select('id')
        .single();

      if (auditError || !audit) {
        summary.brands_failed++;
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

      // ── Extract competitors (direct call, no HTTP) ─────────
      try {
        await extractCompetitorsForAudit(audit.id);
      } catch (err) {
        summary.competitor_extraction_errors.push(`${brand.name}: ${err instanceof Error ? err.message : 'unknown'}`);
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
      // Mark any in-progress audit as failed
      const { data: failedAudit } = await supabase
        .from('audits')
        .select('id')
        .eq('brand_id', brand.id)
        .eq('audit_type', 'monitoring')
        .eq('status', 'running')
        .gte('created_at', todayStart.toISOString())
        .limit(1)
        .maybeSingle();

      if (failedAudit) {
        await supabase.from('audits').update({ status: 'failed' }).eq('id', failedAudit.id);
      }
      summary.brands_failed++;
    }
  }

  return NextResponse.json({ success: true, summary });
}
