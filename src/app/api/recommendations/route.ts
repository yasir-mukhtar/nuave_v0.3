import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// v3 type mapping: Claude returns old names → map to schema constraint values
const TYPE_MAP: Record<string, string> = {
  meta_structure: 'technical',
  content_gap: 'content',
  web_copy: 'web_copy',
  technical: 'technical',
  content: 'content',
};

export async function POST(request: Request) {
  try {
    const { audit_id } = await request.json();

    if (!audit_id) {
      return NextResponse.json({ error: 'audit_id required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // 1. Get audit → resolve brand_id (v3: audits.brand_id, not project_id)
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('id, brand_id, visibility_score, total_prompts, brand_mention_count')
      .eq('id', audit_id)
      .single();

    if (auditError || !audit) {
      console.error('Audit fetch error:', auditError);
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    const brand_id = audit.brand_id;

    // 2. Check if open recommendations already exist for this brand
    // (v3: recommendations are brand-level, not audit-level)
    const { data: existing } = await supabase
      .from('recommendations')
      .select('*')
      .eq('brand_id', brand_id)
      .eq('status', 'open')
      .order('created_at', { ascending: true });

    if (existing && existing.length > 0) {
      // Still update last_seen_audit_id for all open recs (marks them as still relevant)
      await supabase
        .from('recommendations')
        .update({ last_seen_audit_id: audit_id, updated_at: new Date().toISOString() })
        .eq('brand_id', brand_id)
        .eq('status', 'open');
      return NextResponse.json({ success: true, recommendations: existing });
    }

    // 3. Get brand details (v3: brands table, not projects)
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('name, website_url, company_overview, industry, differentiators')
      .eq('id', brand_id)
      .single();

    if (brandError || !brand) {
      console.error('Brand fetch error:', brandError);
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // 4. Get brand competitors (v3: brand_competitors table, not brands.competitors[])
    const { data: competitorRows } = await supabase
      .from('brand_competitors')
      .select('name')
      .eq('brand_id', brand_id);

    const competitors = (competitorRows ?? []).map(r => r.name);

    // 5. Get audit results for context
    const { data: results } = await supabase
      .from('audit_results')
      .select('prompt_text, brand_mentioned, competitor_mentions')
      .eq('audit_id', audit_id);

    const mentionedCount = results?.filter(r => r.brand_mentioned).length ?? 0;
    const totalPrompts = results?.length ?? 0;

    const missedPrompts = results
      ?.filter(r => !r.brand_mentioned)
      .map(r => r.prompt_text)
      .join('\n- ') || '';

    const competitorMentions = results
      ?.flatMap(r => r.competitor_mentions || [])
      .filter(Boolean) ?? [];

    const topCompetitors = [...new Set([...competitors, ...competitorMentions])]
      .slice(0, 5)
      .join(', ');

    // 6. Generate recommendations via Claude
    const prompt = `You are an AEO (Answer Engine Optimization) expert.

Analyze this brand's AI visibility audit results and generate 6 specific, actionable recommendations to improve their visibility in AI-generated answers.

BRAND: ${brand.name}
WEBSITE: ${brand.website_url}
INDUSTRY: ${brand.industry || 'General'}
OVERVIEW: ${brand.company_overview}
DIFFERENTIATORS: ${(brand.differentiators || []).join(', ')}
VISIBILITY SCORE: ${audit.visibility_score}/100
MENTIONED IN: ${mentionedCount}/${totalPrompts} prompts
TOP COMPETITORS MENTIONED INSTEAD: ${topCompetitors}

PROMPTS WHERE BRAND WAS NOT MENTIONED:
- ${missedPrompts}

Generate exactly 6 recommendations. For each recommendation:
- type: one of "web_copy", "content_gap", "meta_structure"
- priority: "high", "medium", or "low"
- title: short headline (max 8 words)
- description: 2-3 sentence explanation of WHY this matters for AEO and what to fix
- page_target: which page this applies to (e.g. "Homepage", "About page", "Blog", "All pages"), or null if applies to the whole brand

Rules:
- At least 2 must be "high" priority
- Mix the types: 2-3 web_copy, 2 content_gap, 1-2 meta_structure
- Be specific to this brand, not generic advice
- Focus on why AI tools are missing this brand

Return ONLY a JSON array, no other text:
[
  {
    "type": "web_copy",
    "priority": "high",
    "title": "...",
    "description": "...",
    "page_target": "..."
  }
]`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    let generated: Array<{
      type: string;
      priority: string;
      title: string;
      description: string;
      page_target: string | null;
    }>;

    try {
      generated = JSON.parse(
        rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      );
    } catch {
      console.error('Failed to parse Claude JSON:', rawText);
      return NextResponse.json({ error: 'Failed to generate valid recommendations' }, { status: 500 });
    }

    // 7. Brand-level upsert: for each generated rec, check if one exists with
    //    same (brand_id, type, page_target). If yes — update last_seen; if no — insert.
    const saved: any[] = [];

    for (const rec of generated) {
      const mappedType = TYPE_MAP[rec.type] ?? rec.type;
      const pageTarget = rec.page_target ?? null;

      // Look for existing open/applied rec with same brand + type + page_target
      let existingQuery = supabase
        .from('recommendations')
        .select('id, status')
        .eq('brand_id', brand_id)
        .eq('type', mappedType);

      if (pageTarget === null) {
        existingQuery = existingQuery.is('page_target', null);
      } else {
        existingQuery = existingQuery.eq('page_target', pageTarget);
      }

      const { data: existingRec } = await existingQuery
        .not('status', 'eq', 'dismissed')
        .maybeSingle();

      if (existingRec) {
        // Update last_seen + refresh metadata
        const { data: updated } = await supabase
          .from('recommendations')
          .update({
            last_seen_audit_id: audit_id,
            priority: rec.priority,
            title: rec.title,
            description: rec.description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRec.id)
          .select()
          .single();
        if (updated) saved.push(updated);
      } else {
        // Insert new brand-level recommendation
        const { data: inserted } = await supabase
          .from('recommendations')
          .insert({
            brand_id,
            source_audit_id: audit_id,
            last_seen_audit_id: audit_id,
            type: mappedType,
            priority: rec.priority,
            title: rec.title,
            description: rec.description,
            page_target: pageTarget,
            status: 'open',
            credits_used: 0,
          })
          .select()
          .single();
        if (inserted) saved.push(inserted);
      }
    }

    return NextResponse.json({ success: true, recommendations: saved });

  } catch (error: any) {
    console.error('Recommendations API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
