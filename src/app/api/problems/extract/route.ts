export const runtime = 'nodejs';

import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const BATCH_SIZE = 20;

interface ExtractedProblem {
  problem_type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

function computeProblemKey(promptText: string, problemType: string): string {
  const hash = createHash('sha256').update(promptText).digest('hex').slice(0, 12);
  return `${hash}::${problemType}`;
}

export async function POST(request: Request) {
  try {
    const { audit_id } = await request.json();

    if (!audit_id) {
      return NextResponse.json({ error: 'audit_id required' }, { status: 400 });
    }

    // Authenticate user
    const serverSupabase = await createSupabaseServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // Fetch audit + brand profile
    const { data: audit, error: auditError } = await admin
      .from('audits')
      .select('id, brand_id')
      .eq('id', audit_id)
      .single();

    if (auditError || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    const { data: brand, error: brandError } = await admin
      .from('brands')
      .select('id, name, website_url, industry, differentiators, workspace_id')
      .eq('id', audit.brand_id)
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
      // Check org-level access
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

    // Fetch all audit results
    const { data: results, error: resultsError } = await admin
      .from('audit_results')
      .select('id, prompt_text, ai_response, brand_mentioned')
      .eq('audit_id', audit_id)
      .order('created_at', { ascending: true });

    if (resultsError || !results || results.length === 0) {
      return NextResponse.json({ problems_found: 0, audit_id });
    }

    // Process in batches of BATCH_SIZE, sequentially
    let totalProblemsFound = 0;

    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const batch = results.slice(i, i + BATCH_SIZE);

      const auditResultsForPrompt = batch.map((r) => ({
        audit_result_id: r.id,
        prompt_text: r.prompt_text ?? '',
        ai_response: r.ai_response ?? '',
        brand_mentioned: r.brand_mentioned,
      }));

      const prompt = `You are an AI visibility diagnostic engine. Analyze the following audit results and identify specific problems for each prompt where the brand has visibility issues.

Brand: ${brand.name}
Website: ${brand.website_url ?? 'N/A'}
Industry: ${brand.industry ?? 'General'}

Audit results:
${JSON.stringify(auditResultsForPrompt, null, 2)}

For each audit result, return problems found. If no problems exist for a result (brand mentioned positively, no issues), return an empty array for that result.

Return a JSON object keyed by audit_result_id:
{
  "{audit_result_id}": [
    {
      "problem_type": string,  // one of: missing_schema, weak_brand_entity, no_content_coverage, negative_sentiment, competitor_dominance, poor_page_structure, missing_faq, weak_trust_signals
      "severity": "high" | "medium" | "low",
      "title": string,         // max 60 chars, Bahasa Indonesia
      "description": string    // 1-2 sentences, Bahasa Indonesia
    }
  ]
}

Return only valid JSON. No preamble, no markdown.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

      let parsed: Record<string, ExtractedProblem[]>;
      try {
        parsed = JSON.parse(
          rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        );
      } catch {
        console.error('Failed to parse problem extraction JSON:', rawText.slice(0, 500));
        continue;
      }

      // Upsert problems using SELECT-then-INSERT/UPDATE pattern
      // (preserves first_seen_audit_id on conflict — same pattern as old recommendations upsert)
      for (const result of batch) {
        const problems = parsed[result.id];
        if (!problems || !Array.isArray(problems) || problems.length === 0) continue;

        const promptText = result.prompt_text ?? '';

        for (const problem of problems) {
          const problemKey = computeProblemKey(promptText, problem.problem_type);

          // Check if this problem already exists for this brand
          const { data: existing } = await admin
            .from('audit_problems')
            .select('id')
            .eq('brand_id', audit.brand_id)
            .eq('problem_key', problemKey)
            .maybeSingle();

          if (existing) {
            // Update: refresh metadata, re-open if resolved (regression detection)
            await admin
              .from('audit_problems')
              .update({
                last_seen_audit_id: audit_id,
                audit_result_id: result.id,
                severity: problem.severity,
                title: problem.title,
                description: problem.description,
                status: 'unresolved',
              })
              .eq('id', existing.id);
          } else {
            // Insert new problem
            await admin
              .from('audit_problems')
              .insert({
                audit_id,
                audit_result_id: result.id,
                brand_id: audit.brand_id,
                problem_key: problemKey,
                severity: problem.severity,
                problem_type: problem.problem_type,
                title: problem.title,
                description: problem.description,
                status: 'unresolved',
                first_seen_audit_id: audit_id,
                last_seen_audit_id: audit_id,
              });
          }

          totalProblemsFound++;
        }
      }
    }

    return NextResponse.json({ problems_found: totalProblemsFound, audit_id });

  } catch (error: any) {
    console.error('Problem extraction error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
