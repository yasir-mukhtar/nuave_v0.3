import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { getOrgPlan, checkRecommendations } from '@/lib/plan-gate';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(request: Request) {
  try {
    const { recommendation_id } = await request.json();

    if (!recommendation_id) {
      return NextResponse.json({ error: 'recommendation_id required' }, { status: 400 });
    }

    // Authenticate user (server client carries request cookies)
    const serverSupabase = await createSupabaseServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin client for recommendation queries
    const supabase = createSupabaseAdminClient();

    // Plan-based access check (fail closed)
    const orgPlan = await getOrgPlan(supabase, user.id);
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

    // v3: join recommendations → brands → workspaces for auth check
    const { data: rec, error: recError } = await supabase
      .from('recommendations')
      .select('*, brands!inner(name, website_url, workspace_id)')
      .eq('id', recommendation_id)
      .single();

    if (recError || !rec) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    // Verify user has access to this recommendation's brand/workspace
    const brandData = rec.brands as { name: string; website_url: string | null; workspace_id: string };
    const { data: wsMembership } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', brandData.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!wsMembership) {
      // Check org-level access
      const { data: ws } = await supabase
        .from('workspaces')
        .select('org_id')
        .eq('id', brandData.workspace_id)
        .single();

      if (ws) {
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('org_id', ws.org_id)
          .eq('user_id', user.id)
          .in('role', ['owner', 'admin'])
          .maybeSingle();

        if (!orgMember) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Idempotency: if already revealed, return cached copy without charging
    if (rec.suggested_copy) {
      return NextResponse.json({ suggested_copy: rec.suggested_copy });
    }

    const brandName = brandData.name || 'the brand';
    const websiteUrl = brandData.website_url || '';
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
        credits_used: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recommendation_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 });
    }

    return NextResponse.json({ suggested_copy });

  } catch (error: unknown) {
    console.error('Reveal API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
