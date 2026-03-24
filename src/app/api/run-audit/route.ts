import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

const OPENAI_MODEL = "gpt-4o-2024-11-20";

interface PromptRequest {
  id: string;
  prompt_text: string;
  stage: string;
  language: string;
}

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
      prompts: PromptRequest[];
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
        console.error('Credit deduction RPC failed:', rpcError);
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
    if (typeof (globalThis as any).EdgeRuntime !== 'undefined') {
      // @ts-ignore
      globalThis.waitUntil?.(backgroundProcess);
    }

    return NextResponse.json({
      success: true,
      audit_id: auditId,
      status: 'running',
    });

  } catch (error: any) {
    console.error('Audit Runner API Error:', error);

    if (auditId) {
      await supabase.from('audits').update({ status: 'failed' }).eq('id', auditId);
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function processAuditInBackground(
  auditId: string,
  brandId: string,
  prompts: PromptRequest[],
  brandName: string,
  userId: string | null,
  orgId: string | null,
  creditsUsed: number
) {
  const supabase = createSupabaseAdminClient();
  let totalBrandMentionCount = 0;

  try {
    const brandLower = brandName.trim().toLowerCase();
    const brandNoSpaces = brandLower.replace(/\s+/g, '');

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];

      // 500ms delay between calls to avoid rate limits
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      try {
        const response = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            temperature: 0,
            input: prompt.prompt_text,
            tools: [{
              type: "web_search_preview",
              user_location: {
                type: "approximate",
                country: prompt.language === 'ms' ? 'MY' : 'ID',
                city: prompt.language === 'ms' ? 'Kuala Lumpur' : 'Jakarta',
              },
              search_context_size: "medium",
            }],
          }),
        });

        const data = await response.json();

        // Extract text from output array
        let responseText = '';
        if (data.output && Array.isArray(data.output)) {
          for (const item of data.output) {
            if (item.type === 'message' && item.content) {
              for (const content of item.content) {
                if (content.type === 'output_text' && content.text) {
                  responseText = content.text;
                  break;
                }
              }
            }
          }
        }

        const responseLower = responseText.toLowerCase();

        let brandMentioned = responseLower.includes(brandLower);
        if (!brandMentioned && brandLower.includes(' ')) {
          brandMentioned = responseLower.includes(brandNoSpaces);
        }

        let mentionContext = null;
        if (brandMentioned) {
          totalBrandMentionCount++;
          let index = responseLower.indexOf(brandLower);
          let matchLength = brandLower.length;
          if (index === -1 && brandLower.includes(' ')) {
            index = responseLower.indexOf(brandNoSpaces);
            matchLength = brandNoSpaces.length;
          }
          if (index !== -1) {
            const start = Math.max(0, index - 100);
            const end = Math.min(responseText.length, index + matchLength + 100);
            mentionContext = responseText.substring(start, end);
          }
        }

        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prompt.id);

        await supabase.from('audit_results').insert({
          audit_id: auditId,
          prompt_id: isValidUUID ? prompt.id : null,
          prompt_text: prompt.prompt_text,
          ai_response: responseText,
          brand_mentioned: brandMentioned,
          mention_context: mentionContext,
          mention_sentiment: 'positive',
          competitor_mentions: [],
          position_rank: null,
        });

      } catch (promptError) {
        console.error(`Error processing prompt ${prompt.id}:`, promptError);
      }
    }

    // Update audit record when complete
    const visibilityScore = prompts.length > 0
      ? Math.round((totalBrandMentionCount / prompts.length) * 100)
      : 0;

    await supabase
      .from('audits')
      .update({
        status: 'complete',
        brand_mention_count: totalBrandMentionCount,
        visibility_score: visibilityScore,
        completed_at: new Date().toISOString(),
      })
      .eq('id', auditId);

    // Auto-generate recommendations after audit completes
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nuave.ai';
      await fetch(`${baseUrl}/api/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audit_id: auditId }),
      });
    } catch (err) {
      console.error('Auto-generate recommendations failed:', err);
    }

  } catch (error) {
    console.error('Background audit process failed:', error);
    await supabase.from('audits').update({ status: 'failed' }).eq('id', auditId);

    // v3: refund credits to org (not user)
    if (userId && orgId && creditsUsed > 0) {
      const { error: refundError } = await supabase.rpc('refund_credits', {
        p_org_id: orgId,
        p_amount: creditsUsed,
        p_actioned_by: userId,
        p_audit_id: auditId,
        p_description: 'Refund: audit failed',
      });
      if (refundError) {
        console.error('Credit refund failed:', refundError);
      } else {
        console.log(`Refunded ${creditsUsed} credits to org ${orgId} after audit failure`);
      }
    }
  }
}
