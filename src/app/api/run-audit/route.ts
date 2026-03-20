import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

const OPENAI_MODEL = "gpt-4o-2024-11-20"

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
    const { project_id, prompts, brand_name: requestBrandName, website_url, profile } = body as {
      project_id: string;
      prompts: PromptRequest[];
      brand_name?: string;
      website_url?: string;
      profile?: any;
    };

    if (!project_id || !prompts || !Array.isArray(prompts)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Missing project_id or prompts.' },
        { status: 400 }
      );
    }

    // STEP 0 — Resolve brand name and ensure project exists
    let brandName = requestBrandName || '';

    if (!brandName) {
      const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', project_id)
        .maybeSingle();

      brandName = project?.name || 'the brand';
    }

    // Ensure project record exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .maybeSingle();

    if (!existingProject) {
      console.log(`Project ${project_id} not found. Creating temporary project record.`);
      // Find user's first workspace to assign the project to
      let wsId: string | null = null;
      if (user) {
        const { data: ws } = await supabase
          .from('workspaces')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        wsId = ws?.id ?? null;
      }
      if (wsId) {
        await supabase
          .from('projects')
          .insert({
            id: project_id,
            workspace_id: wsId,
            name: brandName,
            website_url: website_url || '',
            company_overview: profile?.company_overview || '',
          });
      }
    }

    // Always update project with the latest profile data if available
    if (profile) {
      await supabase
        .from('projects')
        .update({
          company_overview: profile.company_overview,
          industry: profile.industry,
          differentiators: profile.differentiators,
          target_audience: profile.target_audience,
          competitors: profile.competitors,
          website_url: website_url || profile.website_url || '',
        })
        .eq('id', project_id);
    }

    // STEP 0.5 — Atomic credit check + deduction (prevents race conditions)
    const creditsNeeded = prompts.length;

    if (user) {
      const { data: newBalance, error: rpcError } = await supabase
        .rpc('deduct_credits', { p_user_id: user.id, p_amount: creditsNeeded });

      if (rpcError) {
        console.error('Credit deduction RPC failed:', rpcError);
        return NextResponse.json(
          { success: false, error: 'Gagal memproses kredit. Silakan coba lagi.' },
          { status: 500 }
        );
      }

      if (newBalance === -1) {
        return NextResponse.json(
          { success: false, error: `Kredit tidak cukup. Anda butuh ${creditsNeeded} kredit.` },
          { status: 402 }
        );
      }
    }

    // STEP 1 — Create audit record in Supabase
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        project_id: project_id,
        status: 'running',
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

    if (!auditId) {
      return NextResponse.json(
        { success: false, error: 'Failed to create audit' },
        { status: 500 }
      );
    }

    // STEP 2 — Start background processing
    const backgroundProcess = processAuditInBackground(
      auditId,
      project_id,
      prompts,
      brandName,
      user?.id || null,
      creditsNeeded
    );

    // Use waitUntil if available (Edge Runtime)
    if (typeof (globalThis as any).EdgeRuntime !== 'undefined') {
      // @ts-ignore
      globalThis.waitUntil?.(backgroundProcess);
    }

    // STEP 3 — Return response immediately
    return NextResponse.json({
      success: true,
      audit_id: auditId,
      status: 'running'
    });

  } catch (error: any) {
    console.error('Audit Runner API Error:', error);
    
    if (auditId) {
      await supabase
        .from('audits')
        .update({ status: 'failed' })
        .eq('id', auditId);
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function processAuditInBackground(
  auditId: string,
  projectId: string,
  prompts: PromptRequest[],
  brandName: string,
  userId: string | null,
  creditsUsed: number
) {
  const supabase = createSupabaseAdminClient();
  let totalBrandMentionCount = 0;

  try {
    const brandLower = brandName.trim().toLowerCase();
    const brandNoSpaces = brandLower.replace(/\s+/g, '');

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      
      // 500ms delay between calls
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      try {
        const response = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
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
                city: prompt.language === 'ms' ? 'Kuala Lumpur' : 'Jakarta'
              },
              search_context_size: "medium"
            }]
          })
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

        // Brand mention detection logic
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

        await supabase
          .from('audit_results')
          .insert({
            audit_id: auditId,
            prompt_id: isValidUUID ? prompt.id : null,
            prompt_text: prompt.prompt_text,
            ai_response: responseText,
            brand_mentioned: brandMentioned,
            mention_context: mentionContext,
            mention_sentiment: 'positive', 
            competitor_mentions: [],
            position_rank: null
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
        completed_at: new Date().toISOString()
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
      // Non-fatal — user can still manually generate
    }

  } catch (error) {
    console.error('Background audit process failed:', error);
    await supabase
      .from('audits')
      .update({ status: 'failed' })
      .eq('id', auditId);

    // Refund credits on complete failure
    if (userId && creditsUsed > 0) {
      const { error: refundError } = await supabase
        .rpc('refund_credits', { p_user_id: userId, p_amount: creditsUsed });
      if (refundError) {
        console.error('Credit refund failed:', refundError);
      } else {
        console.log(`Refunded ${creditsUsed} credits to user ${userId} after audit failure`);
      }
    }
  }
}
