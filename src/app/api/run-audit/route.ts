import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { extractProblemsForAudit } from '@/lib/problems';
import {
  type PromptInput,
  processPromptBatches,
  calculateVisibilityScore,
} from '@/lib/audit-engine';
import { extractCompetitorsForAudit } from '@/lib/competitor-extraction';

export async function POST(req: NextRequest) {
  let auditId: string | null = null;
  const supabase = createSupabaseAdminClient();
  const supabaseServer = await createSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  try {
    const body = await req.json();
    const brand_id: string = body.brand_id;
    const { prompts, brand_name: requestBrandName } = body as {
      brand_id: string;
      prompts: PromptInput[];
      brand_name?: string;
    };

    if (!brand_id || !prompts || !Array.isArray(prompts)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Missing brand_id or prompts.' },
        { status: 400 }
      );
    }

    // STEP 0 — Resolve brand name from brands table (v3)
    let brandName = requestBrandName || '';
    if (!brandName) {
      const { data: brand } = await supabase
        .from('brands')
        .select('name')
        .eq('id', brand_id)
        .maybeSingle();
      brandName = brand?.name || 'the brand';
    }

    // STEP 0.5 — Resolve org_id for credit operations (v3: credits on org, not user)
    let orgId: string | null = null;
    if (user) {
      const { data: om } = await supabase
        .from('organization_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      orgId = om?.org_id ?? null;
    }

    const creditsNeeded = prompts.length;

    // STEP 1 — Create audit record (status: pending until credits confirmed)
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        brand_id,
        created_by: user?.id ?? null,
        status: 'pending',
        total_prompts: prompts.length,
        brand_mention_count: 0,
        credits_used: creditsNeeded,
        audit_type: 'manual',
      })
      .select('id')
      .single();

    if (auditError || !audit) {
      throw new Error(`Failed to create audit record: ${auditError?.message}`);
    }

    auditId = audit.id;

    // STEP 2 — Atomic credit deduction (v3: org-scoped, audit_id linked)
    if (user && orgId) {
      const { data: newBalance, error: rpcError } = await supabase
        .rpc('deduct_credits', {
          p_org_id: orgId,
          p_amount: creditsNeeded,
          p_actioned_by: user.id,
          p_audit_id: auditId,
          p_description: `Audit: ${creditsNeeded} prompts`,
        });

      if (rpcError) {
        await supabase.from('audits').update({ status: 'failed' }).eq('id', auditId);
        return NextResponse.json(
          { success: false, error: 'Gagal memproses kredit. Silakan coba lagi.' },
          { status: 500 }
        );
      }

      if (newBalance === -1) {
        await supabase.from('audits').update({ status: 'failed' }).eq('id', auditId);
        return NextResponse.json(
          { success: false, error: `Kredit tidak cukup. Anda butuh ${creditsNeeded} kredit.` },
          { status: 402 }
        );
      }
    }

    // STEP 3 — Mark audit as running and kick off background processing
    await supabase.from('audits').update({ status: 'running' }).eq('id', auditId);

    const backgroundProcess = processAuditInBackground(
      auditId!,
      brand_id,
      prompts,
      brandName,
      user?.id ?? null,
      orgId,
      creditsNeeded
    );

    // Use waitUntil if available (Edge Runtime)
    if (typeof (globalThis as Record<string, unknown>).EdgeRuntime !== 'undefined') {
      // @ts-expect-error waitUntil may exist on Edge Runtime globalThis
      globalThis.waitUntil?.(backgroundProcess);
    }

    return NextResponse.json({
      success: true,
      audit_id: auditId,
      status: 'running',
    });

  } catch (error: unknown) {
    if (auditId) {
      await supabase.from('audits').update({ status: 'failed' }).eq('id', auditId);
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function processAuditInBackground(
  auditId: string,
  brandId: string,
  prompts: PromptInput[],
  brandName: string,
  userId: string | null,
  orgId: string | null,
  creditsUsed: number
) {
  const supabase = createSupabaseAdminClient();

  try {
    // Run all prompts and insert results via shared engine
    const { totalMentions } = await processPromptBatches(auditId, prompts, brandName);
    const visibilityScore = calculateVisibilityScore(totalMentions, prompts.length);

    // Extract competitors before marking complete (so report page has data immediately)
    try {
      await extractCompetitorsForAudit(auditId);
    } catch {
      // Competitor extraction failure should not block audit completion
    }

    // Extract problems before marking complete (so findings are ready on report page)
    try {
      await extractProblemsForAudit(auditId, brandId);
    } catch {
      // Problem extraction failure should not block audit completion
    }

    await supabase
      .from('audits')
      .update({
        status: 'complete',
        brand_mention_count: totalMentions,
        visibility_score: visibilityScore,
        completed_at: new Date().toISOString(),
      })
      .eq('id', auditId);

  } catch {
    await supabase.from('audits').update({ status: 'failed' }).eq('id', auditId);

    if (userId && orgId && creditsUsed > 0) {
      await supabase.rpc('refund_credits', {
        p_org_id: orgId,
        p_amount: creditsUsed,
        p_actioned_by: userId,
        p_audit_id: auditId,
        p_description: 'Refund: audit failed',
      });
    }
  }
}
