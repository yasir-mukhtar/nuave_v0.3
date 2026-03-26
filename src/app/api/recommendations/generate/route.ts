import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const CREDIT_COST = 10;

const UI_TO_DB_TYPE = {
  teknikal: 'technical',
  web_copy: 'web_copy',
  konten: 'content',
} as const;

type UiCategory = keyof typeof UI_TO_DB_TYPE;

const CAT_DESC: Record<UiCategory, string> = {
  teknikal: 'technical/structural optimizations (schema markup, structured data, Core Web Vitals, crawlability, alt text)',
  web_copy: 'website copy improvements (headlines, CTAs, meta descriptions, product pages, FAQs, trust signals)',
  konten: 'long-form content creation (comprehensive guides, comparison articles, how-to content, blog posts)',
};

async function generateForCategory(
  category: UiCategory,
  brand: { name: string; website_url: string | null; industry: string | null; company_overview: string | null }
) {
  const prompt = `You are an AEO (Answer Engine Optimization) expert helping ${brand.name} (${brand.website_url ?? 'their website'}) improve their visibility in AI-generated answers.

Industry: ${brand.industry ?? 'General'}
Overview: ${brand.company_overview ?? 'A business seeking better AI visibility'}

Generate exactly 1 specific, actionable recommendation in the category: ${CAT_DESC[category]}

Return ONLY valid JSON — no markdown fences, no explanation, just the JSON object:
{
  "priority": "high",
  "title": "Concise title in 8 words or fewer",
  "description": "2–3 sentences: what the gap is, why it hurts AI visibility, and what to fix.",
  "blocks": [
    {
      "label": "Section title",
      "body": "Ready-to-use content, copy, or code specific to ${brand.name}",
      "copyable": true
    }
  ]
}

Rules:
- blocks: 1–3 items. Body content must be immediately usable — not generic advice.
- If the fix involves code or markup, put it in a separate block (copyable: true).
- For informational notes (where to apply, why, caveats): copyable: false.
- Priority: high if directly impacts AI citation likelihood, medium otherwise.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  return JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
}

export async function POST(request: Request) {
  try {
    const { brand_id } = await request.json();

    if (!brand_id) {
      return NextResponse.json({ error: 'brand_id required' }, { status: 400 });
    }

    // Auth
    const serverSupabase = await createSupabaseServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    // Get org + credits
    const { data: omData } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(credits_balance)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!omData) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const org = omData.organizations as unknown as { credits_balance: number } | null;
    const credits = org?.credits_balance ?? 0;

    if (credits < CREDIT_COST) {
      return NextResponse.json({ error: 'Insufficient credits', credits }, { status: 402 });
    }

    // Get brand details
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('name, website_url, industry, company_overview')
      .eq('id', brand_id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Generate 3 recs in parallel (1 per category)
    const categories: UiCategory[] = ['teknikal', 'web_copy', 'konten'];
    const results = await Promise.allSettled(
      categories.map((cat) => generateForCategory(cat, brand))
    );

    // Insert to DB
    const now = new Date().toISOString();
    const insertedRecs: any[] = [];

    for (let i = 0; i < categories.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        console.error(`Failed to generate ${categories[i]}:`, result.reason);
        continue;
      }

      const generated = result.value;
      const { data: inserted } = await supabase
        .from('recommendations')
        .insert({
          brand_id,
          type: UI_TO_DB_TYPE[categories[i]],
          priority: generated.priority ?? 'medium',
          title: generated.title,
          description: generated.description,
          suggested_copy: JSON.stringify(generated.blocks ?? []),
          status: 'open',
          credits_used: 0,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (inserted) insertedRecs.push(inserted);
    }

    // Deduct credits
    await supabase
      .from('organizations')
      .update({ credits_balance: credits - CREDIT_COST })
      .eq('id', omData.organization_id);

    return NextResponse.json({ success: true, recommendations: insertedRecs });

  } catch (error: any) {
    console.error('Generate recommendations error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
