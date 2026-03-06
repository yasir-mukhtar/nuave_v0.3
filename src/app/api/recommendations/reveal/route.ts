import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(request: Request) {
  try {
    const { recommendation_id } = await request.json()
    
    if (!recommendation_id) {
      return NextResponse.json({ error: 'recommendation_id required' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    // Fetch recommendation with related workspace context
    const { data: rec, error: recError } = await supabase
      .from('recommendations')
      .select('*, audits!inner(*, workspaces!inner(*))')
      .eq('id', recommendation_id)
      .single()

    if (recError || !rec) {
      console.error('Recommendation fetch error:', recError)
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }

    // Access nested workspace data safely
    const audit = (rec.audits as any); // Cast to any to bypass TS strict typing for now
    const workspace = audit?.workspaces;
    
    const brandName = workspace?.brand_name || 'the brand';
    const websiteUrl = workspace?.website_url || '';

    // Extract page target from description if column is missing (fallback strategy)
    // Assuming page_target might be part of the schema or extracted from description as per prompt
    // For now, I'll assume we use what we have in the DB or from the description logic
    
    const pageTarget = rec.page_target || (rec.description.includes('Page target:') 
      ? rec.description.split('Page target:')[1].trim() 
      : 'Relevant page');

    const prompt = `You are an AEO copywriting expert.

Generate specific suggested copy to fix this issue for ${brandName} (${websiteUrl}):

ISSUE TYPE: ${rec.type}
TITLE: ${rec.title}
DESCRIPTION: ${rec.description}
PAGE TARGET: ${pageTarget}

Write the actual improved copy they should use.
For web_copy: write the improved paragraph/section (100-200 words)
For content_gap: write a content brief or key talking points (150-250 words)
For meta_structure: write the improved meta description or structured data guidance (50-100 words)

Be specific, actionable, and ready to use. No preamble.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    })

    const suggested_copy = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    // Update recommendation with suggested copy and deduct credit (tracking)
    const { error: updateError } = await supabase
      .from('recommendations')
      .update({ 
        suggested_copy,
        credits_used: 1
      })
      .eq('id', recommendation_id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 })
    }

    return NextResponse.json({ suggested_copy })
  } catch (error: any) {
    console.error('Reveal API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
