import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(request: Request) {
  try {
    const { recommendation_id } = await request.json();

    if (!recommendation_id) {
      return NextResponse.json({ error: 'recommendation_id required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // v3: join recommendations → brands (not → audits → workspaces)
    const { data: rec, error: recError } = await supabase
      .from('recommendations')
      .select('*, brands!inner(name, website_url)')
      .eq('id', recommendation_id)
      .single();

    if (recError || !rec) {
      console.error('Recommendation fetch error:', recError);
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    const brand = (rec.brands as { name: string; website_url: string | null } | null);
    const brandName = brand?.name || 'the brand';
    const websiteUrl = brand?.website_url || '';
    const pageTarget = rec.page_target || 'Relevant page';

    const prompt = `You are an AEO copywriting expert.

Generate specific suggested copy to fix this issue for ${brandName} (${websiteUrl}):

ISSUE TYPE: ${rec.type}
TITLE: ${rec.title}
DESCRIPTION: ${rec.description}
PAGE TARGET: ${pageTarget}

Write the actual improved copy they should use.
For web_copy: write the improved paragraph/section (100-200 words)
For content: write a content brief or key talking points (150-250 words)
For technical: write the improved meta description or structured data guidance (50-100 words)

Be specific, actionable, and ready to use. No preamble.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const suggested_copy = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    const { error: updateError } = await supabase
      .from('recommendations')
      .update({
        suggested_copy,
        credits_used: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recommendation_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 });
    }

    return NextResponse.json({ suggested_copy });

  } catch (error: any) {
    console.error('Reveal API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
