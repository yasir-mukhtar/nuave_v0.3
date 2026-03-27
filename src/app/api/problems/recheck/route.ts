export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const OPENAI_MODEL = 'gpt-4o-2024-11-20';

export async function POST(request: Request) {
  try {
    const { problem_id } = await request.json();

    if (!problem_id) {
      return NextResponse.json({ error: 'problem_id required' }, { status: 400 });
    }

    // Authenticate user
    const serverSupabase = await createSupabaseServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // Fetch problem
    const { data: problem, error: problemError } = await admin
      .from('audit_problems')
      .select('*')
      .eq('id', problem_id)
      .single();

    if (problemError || !problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    // Fetch brand profile
    const { data: brand, error: brandError } = await admin
      .from('brands')
      .select('id, name, language, workspace_id')
      .eq('id', problem.brand_id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Verify user has access to this brand's workspace
    const { data: membership } = await admin
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', brand.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      const { data: workspace } = await admin
        .from('workspaces')
        .select('org_id')
        .eq('id', brand.workspace_id)
        .single();

      if (workspace) {
        const { data: orgMembership } = await admin
          .from('organization_members')
          .select('user_id')
          .eq('org_id', workspace.org_id)
          .eq('user_id', user.id)
          .in('role', ['owner', 'admin'])
          .maybeSingle();

        if (!orgMembership) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Check audit_result_id is not null
    if (!problem.audit_result_id) {
      return NextResponse.json(
        { error: 'Konteks audit asli tidak ditemukan. Recheck tidak dapat dilakukan.' },
        { status: 404 }
      );
    }

    // Fetch original audit result
    const { data: auditResult, error: resultError } = await admin
      .from('audit_results')
      .select('prompt_text, ai_response')
      .eq('id', problem.audit_result_id)
      .single();

    if (resultError || !auditResult || !auditResult.prompt_text) {
      return NextResponse.json(
        { error: 'Konteks audit asli tidak ditemukan. Recheck tidak dapat dilakukan.' },
        { status: 404 }
      );
    }

    const promptText = auditResult.prompt_text;
    const originalAiResponse = auditResult.ai_response ?? '';

    // Look up org_id via brands → workspaces → org_id
    const { data: workspace } = await admin
      .from('workspaces')
      .select('org_id')
      .eq('id', brand.workspace_id)
      .single();

    if (!workspace?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Deduct 1 credit
    const { data: newBalance, error: rpcError } = await admin
      .rpc('deduct_credits', {
        p_org_id: workspace.org_id,
        p_amount: 1,
        p_actioned_by: user.id,
        p_audit_id: null,
        p_description: 'Recheck masalah',
      });

    if (rpcError) {
      console.error('deduct_credits RPC error:', rpcError);
      return NextResponse.json({ error: 'Credit deduction failed' }, { status: 500 });
    }

    if (newBalance === -1) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Re-run the original prompt against GPT-4o with web search
    // (duplicated from runSinglePrompt() in run-audit/route.ts lines 169-205)
    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0,
        input: promptText,
        tools: [{
          type: 'web_search_preview',
          user_location: {
            type: 'approximate',
            country: brand.language === 'ms' ? 'MY' : 'ID',
            city: brand.language === 'ms' ? 'Kuala Lumpur' : 'Jakarta',
          },
          search_context_size: 'medium',
        }],
      }),
    });

    const openaiData = await openaiResponse.json();

    let newAiResponse = '';
    if (openaiData.output && Array.isArray(openaiData.output)) {
      for (const item of openaiData.output) {
        if (item.type === 'message' && item.content) {
          for (const content of item.content) {
            if (content.type === 'output_text' && content.text) {
              newAiResponse = content.text;
              break;
            }
          }
        }
      }
    }

    // Call Claude to evaluate whether the problem is resolved
    const evaluationPrompt = `You are an AI visibility analyst. Compare these two AI responses to the same search prompt and determine whether a specific problem has been resolved.

Brand: ${brand.name}
Search prompt tested: ${promptText}

Problem being checked:
- Type: ${problem.problem_type}
- Title: ${problem.title}
- Description: ${problem.description}

Original AI response (when problem was detected):
${originalAiResponse}

New AI response (after fixes):
${newAiResponse}

Determine:
1. Is the problem resolved? (yes / partial / no)
2. A short explanation in Bahasa Indonesia (2-3 sentences) explaining what changed or why it's still an issue.

Return only valid JSON:
{
  "resolved": "yes" | "partial" | "no",
  "explanation": string
}`;

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      messages: [{ role: 'user', content: evaluationPrompt }],
    });

    const rawText = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';

    let evaluation: { resolved: 'yes' | 'partial' | 'no'; explanation: string };
    try {
      evaluation = JSON.parse(
        rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      );
    } catch {
      console.error('Failed to parse recheck evaluation JSON:', rawText);
      return NextResponse.json({ error: 'Failed to parse evaluation result' }, { status: 500 });
    }

    // Update problem status based on evaluation
    let newStatus: 'resolved' | 'in_progress' | 'unresolved';
    const updateData: Record<string, any> = {};

    if (evaluation.resolved === 'yes') {
      newStatus = 'resolved';
      updateData.status = 'resolved';
      updateData.resolved_at = new Date().toISOString();
    } else if (evaluation.resolved === 'partial') {
      newStatus = 'in_progress';
      updateData.status = 'in_progress';
      updateData.resolved_at = null;
    } else {
      newStatus = 'unresolved';
      updateData.status = 'unresolved';
      updateData.resolved_at = null;
    }

    await admin
      .from('audit_problems')
      .update(updateData)
      .eq('id', problem_id);

    return NextResponse.json({
      resolved: evaluation.resolved,
      explanation: evaluation.explanation,
      problem_id,
      new_status: newStatus,
    });

  } catch (error: any) {
    console.error('Recheck error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
