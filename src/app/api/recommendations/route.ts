import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(request: Request) {
  try {
    const { audit_id } = await request.json()

    if (!audit_id) {
      return NextResponse.json(
        { error: 'audit_id required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdminClient()

    // 1. Check if recommendations already exist for this audit
    const { data: existing } = await supabase
      .from('recommendations')
      .select('*')
      .eq('audit_id', audit_id)
      .order('created_at', { ascending: true });

    if (existing && existing.length > 0) {
      // Already generated — return immediately, no Claude call needed
      return NextResponse.json({ success: true, recommendations: existing });
    }

    // 2. Query 1: get audit
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('*')
      .eq('id', audit_id)
      .single()

    if (auditError || !audit) {
      console.error('Audit fetch error:', auditError)
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      )
    }
    console.log('audit:', audit)

    // Query 2: get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', audit.project_id)
      .single()

    if (projectError || !project) {
      console.error('Project fetch error:', projectError)
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    console.log('project:', project)

    // Fetch audit results
    const { data: results, error: resultsError } = await supabase
      .from('audit_results')
      .select('*')
      .eq('audit_id', audit_id)

    if (resultsError) {
      console.error('Results fetch error:', resultsError)
    }
    console.log('results count:', results?.length)

    const brandName = project.name
    const websiteUrl = project.website_url
    const companyOverview = project.company_overview
    const industry = project.industry || 'General'
    const differentiators = project.differentiators
    const visibilityScore = audit.visibility_score

    const mentionedCount = results?.filter(r => r.brand_mentioned).length || 0
    const totalPrompts = results?.length || 0

    // Build context from audit results
    const missedPrompts = results
      ?.filter(r => !r.brand_mentioned)
      .map(r => r.prompt_text)
      .join('\n- ') || ''

    const competitorMentions = results
      ?.flatMap(r => r.competitor_mentions || [])
      .filter(Boolean) || []

    const topCompetitors = [...new Set(competitorMentions)]
      .slice(0, 5)
      .join(', ')

    const prompt = `You are an AEO (Answer Engine Optimization) expert.

Analyze this brand's AI visibility audit results and generate 6 specific, actionable recommendations to improve their visibility in AI-generated answers.

BRAND: ${brandName}
WEBSITE: ${websiteUrl}
INDUSTRY: ${industry}
OVERVIEW: ${companyOverview}
DIFFERENTIATORS: ${(differentiators || []).join(', ')}
VISIBILITY SCORE: ${visibilityScore}/100
MENTIONED IN: ${mentionedCount}/${totalPrompts} prompts
TOP COMPETITORS MENTIONED INSTEAD: ${topCompetitors}

PROMPTS WHERE BRAND WAS NOT MENTIONED:
- ${missedPrompts}

Generate exactly 6 recommendations. For each recommendation:
- type: one of "web_copy", "content_gap", "meta_structure"  
- priority: "high", "medium", or "low"
- title: short headline (max 8 words)
- description: 2-3 sentence explanation of WHY this matters for AEO and what to fix
- page_target: which page this applies to (e.g. "Homepage", "About page", "Blog", "All pages")

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
]`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })

    const rawText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : ''
    console.log('raw response:', rawText)

    // Parse JSON response
    const clean = rawText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    let recommendations: any[]
    try {
      recommendations = JSON.parse(clean)
    } catch (e) {
      console.error('Failed to parse Claude JSON:', clean)
      return NextResponse.json({ error: 'Failed to generate valid recommendations' }, { status: 500 })
    }
    console.log('parsed recs:', recommendations.length)

    // Store in Supabase
    const toInsertWithTarget = recommendations.map((rec: any) => ({
      audit_id,
      project_id: audit.project_id,
      type: rec.type === 'meta_structure' ? 'structure' : rec.type,
      priority: rec.priority,
      title: rec.title,
      description: `${rec.description}\n\nPage target: ${rec.page_target}`,
      credits_used: 0
    }))

    // Delete existing recs for this audit first (re-generate safe)
    await supabase
      .from('recommendations')
      .delete()
      .eq('audit_id', audit_id)
      .eq('credits_used', 0)

    const { data: saved, error: insertError } = await supabase
      .from('recommendations')
      .insert(toInsertWithTarget)
      .select()

    if (insertError) {
      console.error('Recommendations insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save recommendations' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      recommendations: saved 
    })
  } catch (error: any) {
    console.error('Recommendations API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
