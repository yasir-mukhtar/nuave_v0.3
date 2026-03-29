import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { getOrgPlan, checkRecommendations } from '@/lib/plan-gate';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

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
      .select('id, name, website_url, company_overview, industry, differentiators, workspace_id')
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

    // Fetch original audit result for context
    let promptText = '';
    let aiResponse = '';
    if (problem.audit_result_id) {
      const { data: auditResult } = await admin
        .from('audit_results')
        .select('prompt_text, ai_response')
        .eq('id', problem.audit_result_id)
        .single();

      if (auditResult) {
        promptText = auditResult.prompt_text ?? '';
        aiResponse = auditResult.ai_response ?? '';
      }
    }

    // Plan-based access check (fail closed, before idempotency to prevent info leakage)
    const orgPlan = await getOrgPlan(admin, user.id);
    if (!orgPlan) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    const access = checkRecommendations(orgPlan);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason, upgradeTarget: access.upgradeTarget },
        { status: 403 }
      );
    }

    // Idempotency: check if recommendations already exist for this problem
    const { data: existingRecs } = await admin
      .from('recommendations')
      .select('id')
      .eq('problem_id', problem_id)
      .limit(1);

    if (existingRecs && existingRecs.length > 0) {
      return NextResponse.json(
        { error: 'Recommendations already generated for this problem' },
        { status: 409 }
      );
    }

    // Generate recommendations via Claude
    const prompt = `You are an AI visibility optimization expert. Generate actionable recommendations to solve a specific problem detected in an AI visibility audit.

Brand: ${brand.name}
Website: ${brand.website_url ?? 'N/A'}
Industry: ${brand.industry ?? 'General'}
Brand differentiators: ${(brand.differentiators || []).join(', ') || 'N/A'}

Problem detected:
- Type: ${problem.problem_type}
- Severity: ${problem.severity}
- Title: ${problem.title}
- Description: ${problem.description}

Original prompt that surfaced this problem: ${promptText}
AI response that revealed this problem: ${aiResponse}

Generate 2-4 specific, actionable recommendations to fix this problem. Each must directly address the root cause.

Return a JSON array:
[
  {
    "title": string,           // max 60 chars, Bahasa Indonesia
    "description": string,     // 2-3 sentences, Bahasa Indonesia
    "action_type": "technical" | "web_copy" | "content",
    "priority": "high" | "medium" | "low",
    "suggested_copy": string | null
  }
]

Return only valid JSON. No preamble, no markdown.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    let generated: Array<{
      title: string;
      description: string;
      action_type: string;
      priority: string;
      suggested_copy: string | null;
    }>;

    try {
      generated = JSON.parse(
        rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      );
    } catch {
      console.error('Failed to parse recommendation JSON:', rawText.slice(0, 500));
      return NextResponse.json({ error: 'Failed to generate valid recommendations' }, { status: 500 });
    }

    // Insert recommendations linked to this problem
    const now = new Date().toISOString();
    let recommendationsGenerated = 0;

    for (const rec of generated) {
      const { error: insertError } = await admin
        .from('recommendations')
        .insert({
          brand_id: problem.brand_id,
          problem_id: problem.id,
          type: rec.action_type,
          priority: rec.priority,
          title: rec.title,
          description: rec.description,
          suggested_copy: rec.suggested_copy,
          status: 'open',
          credits_used: 0,
          created_at: now,
          updated_at: now,
        });

      if (insertError) {
        console.error('Recommendation insert error:', insertError.message);
      } else {
        recommendationsGenerated++;
      }
    }

    return NextResponse.json({ recommendations_generated: recommendationsGenerated, problem_id });

  } catch (error: unknown) {
    console.error('Generate-for-problem error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
