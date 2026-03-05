import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

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

  try {
    const body = await req.json();
    const { workspace_id, prompts, brand_name: requestBrandName } = body as {
      workspace_id: string;
      prompts: PromptRequest[];
      brand_name?: string;
    };

    if (!workspace_id || !prompts || !Array.isArray(prompts)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Missing workspace_id or prompts.' },
        { status: 400 }
      );
    }

    // STEP 0 — Resolve brand name and ensure workspace exists
    let brandName = requestBrandName || '';

    if (!brandName) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('brand_name')
        .eq('id', workspace_id)
        .maybeSingle();
      
      brandName = workspace?.brand_name || 'the brand';
    }

    // Ensure workspace record exists (Foreign Key Constraint Fix)
    const { data: existingWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspace_id)
      .maybeSingle();

    if (!existingWorkspace) {
      console.log(`Workspace ${workspace_id} not found. Creating temporary workspace record.`);
      await supabase
        .from('workspaces')
        .insert({
          id: workspace_id,
          brand_name: brandName,
          website_url: '',
          user_id: null
        });
    }

    // STEP 1 — Create audit record in Supabase
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .insert({
        workspace_id: workspace_id,
        status: 'running',
        total_prompts: prompts.length,
        brand_mention_count: 0,
        credits_used: prompts.length,
      })
      .select('id')
      .single();

    if (auditError || !audit) {
      throw new Error(`Failed to create audit record: ${auditError?.message}`);
    }

    auditId = audit.id;

    // STEP 3 — Run each prompt sequentially through GPT-4o
    const results = [];
    let totalBrandMentionCount = 0;

    // Detection preparation
    const brandLower = brandName.trim().toLowerCase();
    const brandNoSpaces = brandLower.replace(/\s+/g, '');

    for (const prompt of prompts) {
      // 500ms delay between calls
      if (results.length > 0) {
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
        })
        const data = await response.json()

        // Extract text from output array
        let responseText = ''
        if (data.output && Array.isArray(data.output)) {
          for (const item of data.output) {
            if (item.type === 'message' && item.content) {
              for (const content of item.content) {
                if (content.type === 'output_text' && content.text) {
                  responseText = content.text
                  break
                }
              }
            }
          }
        }

        console.log('Response length:', responseText.length)

        const responseLower = responseText.toLowerCase();

        // 1. Basic case-insensitive check
        let brandMentioned = responseLower.includes(brandLower);
        
        // 2. Check for variation without spaces (e.g., "Webflow" vs "Web flow")
        if (!brandMentioned && brandLower.includes(' ')) {
          brandMentioned = responseLower.includes(brandNoSpaces);
        }

        console.log('Checking for brand:', brandName);
        console.log('Response preview:', responseText.substring(0, 200));
        console.log('Brand mentioned:', brandMentioned);

        let mentionContext = null;
        if (brandMentioned) {
          totalBrandMentionCount++;
          
          // Find the index for context extraction
          let index = responseLower.indexOf(brandLower);
          let matchLength = brandLower.length;

          if (index === -1 && brandLower.includes(' ')) {
            index = responseLower.indexOf(brandNoSpaces);
            matchLength = brandNoSpaces.length;
          }

          if (index !== -1) {
            // Extract 200 chars around the mention (100 before, 100 after)
            const start = Math.max(0, index - 100);
            const end = Math.min(responseText.length, index + matchLength + 100);
            mentionContext = responseText.substring(start, end);
          }
        }

        // Validate prompt.id as UUID before inserting
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prompt.id);

        const { data: resultRecord, error: resultError } = await supabase
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
          })
          .select()
          .single();

        if (resultError) {
          console.error(`Failed to insert audit result for prompt ${prompt.id}:`, resultError);
        }

        results.push(resultRecord || {
          prompt_id: prompt.id,
          prompt_text: prompt.prompt_text,
          ai_response: responseText,
          brand_mentioned: brandMentioned,
          mention_context: mentionContext
        });

      } catch (promptError: any) {
        console.error(`Error processing prompt ${prompt.id}:`, promptError);
        results.push({
          prompt_id: prompt.id,
          prompt_text: prompt.prompt_text,
          error: promptError.message || 'Error calling AI'
        });
      }
    }

    // STEP 4 — Update audit record when complete
    const visibilityScore = prompts.length > 0 
      ? Math.round((totalBrandMentionCount / prompts.length) * 100) 
      : 0;

    const { error: updateError } = await supabase
      .from('audits')
      .update({
        status: 'complete',
        brand_mention_count: totalBrandMentionCount,
        visibility_score: visibilityScore,
        completed_at: new Date().toISOString()
      })
      .eq('id', auditId);

    if (updateError) {
      console.error('Failed to update audit record completion status:', updateError);
    }

    // STEP 5 — Return response
    return NextResponse.json({
      success: true,
      audit_id: auditId,
      visibility_score: visibilityScore,
      brand_mention_count: totalBrandMentionCount,
      total_prompts: prompts.length,
      results: results
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
