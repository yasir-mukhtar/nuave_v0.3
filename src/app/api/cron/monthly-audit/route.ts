import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import {
  type PromptInput,
  processPromptBatches,
  calculateVisibilityScore,
} from '@/lib/audit-engine';
import { extractCompetitorsForAudit } from '@/lib/competitor-extraction';
import { extractProblemsForAudit } from '@/lib/problems';
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

  // ── Fetch all paid orgs with active subscriptions ──────────
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, plan, subscription_status')
    .in('plan', ['starter', 'growth', 'agency'])
    .in('subscription_status', ['active', 'trialing', 'past_due']);

  if (orgsError || !orgs) {
    return NextResponse.json(
      { error: 'Failed to fetch organizations', detail: orgsError?.message },
      { status: 500 }
    );
  }

  const summary = {
    orgs_found: orgs.length,
    brands_processed: 0,
    brands_skipped_dedup: 0,
    brands_skipped_no_prompts: 0,
    brands_failed: 0,
    audits_created: 0,
    competitor_extraction_errors: [] as string[],
    problem_extraction_errors: [] as string[],
  };

  for (const org of orgs) {
    const plan = org.plan as PlanId;
    const limits = getPlanLimits(plan);
    if (!limits.monthlyAutoAudit) continue;

    // Fetch all brands for this org
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('org_id', org.id);

    const wsIds = workspaces?.map(w => w.id) ?? [];
    if (wsIds.length === 0) continue;

    const { data: brands } = await supabase
      .from('brands')
      .select('id, name, language, created_by')
      .in('workspace_id', wsIds);

    if (!brands || brands.length === 0) continue;

    for (const brand of brands) {
      try {
        // ── Dedup: skip if monthly_auto audit in last 25 days ──
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 25);

        const { data: existing } = await supabase
          .from('audits')
          .select('id')
          .eq('brand_id', brand.id)
          .eq('audit_type', 'monthly_auto')
          .gte('created_at', cutoff.toISOString())
          .limit(1)
          .maybeSingle();

        if (existing) {
          summary.brands_skipped_dedup++;
          continue;
        }

        // ── Fetch active prompts ─────────────────────────────
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

        // ── Create monthly auto-audit ────────────────────────
        const { data: audit, error: auditError } = await supabase
          .from('audits')
          .insert({
            brand_id: brand.id,
            created_by: brand.created_by,
            status: 'pending',
            total_prompts: prompts.length,
            brand_mention_count: 0,
            credits_used: 0,
            audit_type: 'monthly_auto',
          })
          .select('id')
          .single();

        if (auditError || !audit) {
          summary.brands_failed++;
          continue;
        }

        // ── Run prompts ──────────────────────────────────────
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

        // ── Extract competitors ──────────────────────────────
        try {
          await extractCompetitorsForAudit(audit.id);
        } catch (err) {
          summary.competitor_extraction_errors.push(
            `${brand.name}: ${err instanceof Error ? err.message : 'unknown'}`
          );
        }

        // ── Extract problems (monthly audit includes this) ───
        try {
          await extractProblemsForAudit(audit.id, brand.id);
        } catch (err) {
          summary.problem_extraction_errors.push(
            `${brand.name}: ${err instanceof Error ? err.message : 'unknown'}`
          );
        }

        // ── Mark complete ────────────────────────────────────
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
  }

  return NextResponse.json({ success: true, summary });
}
