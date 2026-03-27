export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const BATCH_SIZE = 20;

interface ExtractedCompetitor {
  name: string;
  website_url: string | null;
}

export async function POST(request: Request) {
  try {
    const { audit_id } = await request.json();

    if (!audit_id) {
      return NextResponse.json({ error: 'audit_id required' }, { status: 400 });
    }

    // Internal endpoint — called from processAuditInBackground.
    // Auth is handled by the caller; we validate the audit exists.
    const admin = createSupabaseAdminClient();

    // Fetch audit
    const { data: audit, error: auditError } = await admin
      .from('audits')
      .select('id, brand_id')
      .eq('id', audit_id)
      .single();

    if (auditError || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Fetch brand
    const { data: brand, error: brandError } = await admin
      .from('brands')
      .select('id, name, website_url, industry')
      .eq('id', audit.brand_id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Fetch all audit results
    const { data: results, error: resultsError } = await admin
      .from('audit_results')
      .select('id, prompt_text, ai_response')
      .eq('audit_id', audit_id)
      .order('created_at', { ascending: true });

    if (resultsError || !results || results.length === 0) {
      return NextResponse.json({ competitors_found: 0, audit_id });
    }

    // Fetch existing brand_competitors to preserve user-provided URLs
    const { data: existingCompetitors } = await admin
      .from('brand_competitors')
      .select('id, name, website_url')
      .eq('brand_id', audit.brand_id);

    const existingMap = new Map<string, { id: string; website_url: string | null }>();
    (existingCompetitors || []).forEach((c) => {
      existingMap.set(c.name.toLowerCase(), { id: c.id, website_url: c.website_url });
    });

    // Process in batches
    // Accumulate all competitors across batches: result_id → competitors
    const resultCompetitors = new Map<string, ExtractedCompetitor[]>();

    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const batch = results.slice(i, i + BATCH_SIZE);

      const batchData = batch.map((r) => ({
        id: r.id,
        prompt_text: r.prompt_text ?? '',
        ai_response: r.ai_response ?? '',
      }));

      const knownNames = existingCompetitors?.map((c) => c.name) ?? [];

      const prompt = `You are a competitor extraction engine. Analyze these AI-generated responses about "${brand.name}" and identify all competitor brands mentioned in each response.

Brand being audited: ${brand.name}
Brand website: ${brand.website_url ?? 'N/A'}
Industry: ${brand.industry ?? 'General'}
${knownNames.length > 0 ? `Known competitors (use these exact names if they appear): ${knownNames.join(', ')}` : ''}

Audit responses:
${JSON.stringify(batchData, null, 2)}

For each result ID, return the competitor brands mentioned in that AI response.

Rules:
- Do NOT include "${brand.name}" itself as a competitor
- Normalize company names (consistent capitalization, no trailing punctuation)
- For website_url: provide the main domain only (e.g. "karcher.com", "nilfisk.com") if you can infer it. Use null if uncertain.
- Only include actual competing brands/companies, not generic product categories or technologies
- If no competitors are mentioned in a response, return an empty array for that ID

Return a JSON object keyed by result ID:
{
  "{result_id}": [
    { "name": "Competitor Name", "website_url": "competitor.com" }
  ]
}

Return only valid JSON. No preamble, no markdown.`;

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

      let parsed: Record<string, ExtractedCompetitor[]>;
      try {
        parsed = JSON.parse(
          rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        );
      } catch {
        continue;
      }

      // Collect results
      for (const result of batch) {
        const competitors = parsed[result.id];
        if (competitors && Array.isArray(competitors) && competitors.length > 0) {
          resultCompetitors.set(result.id, competitors);
        }
      }
    }

    // --- Step 1: Update audit_results.competitor_mentions (TEXT[]) ---
    for (const [resultId, competitors] of resultCompetitors) {
      const names = competitors.map((c) => c.name);
      await admin
        .from('audit_results')
        .update({ competitor_mentions: names })
        .eq('id', resultId);
    }

    // --- Step 2: Upsert brand_competitors ---
    // Aggregate all unique competitors across all results
    const allCompetitors = new Map<string, string | null>(); // name → best website_url
    for (const competitors of resultCompetitors.values()) {
      for (const c of competitors) {
        const key = c.name.toLowerCase();
        if (!allCompetitors.has(key)) {
          allCompetitors.set(key, c.website_url);
        }
      }
    }

    // Track competitor_id for snapshots
    const competitorIdMap = new Map<string, string>(); // lowercase name → id

    for (const [lowerName, inferredUrl] of allCompetitors) {
      const existing = existingMap.get(lowerName);

      if (existing) {
        // Only update website_url if currently null
        if (!existing.website_url && inferredUrl) {
          await admin
            .from('brand_competitors')
            .update({ website_url: inferredUrl })
            .eq('id', existing.id);
        }
        competitorIdMap.set(lowerName, existing.id);
      } else {
        // Find the properly-cased name from the first occurrence
        let properName = lowerName;
        for (const competitors of resultCompetitors.values()) {
          const match = competitors.find((c) => c.name.toLowerCase() === lowerName);
          if (match) { properName = match.name; break; }
        }

        const { data: inserted } = await admin
          .from('brand_competitors')
          .insert({
            brand_id: audit.brand_id,
            name: properName,
            website_url: inferredUrl,
          })
          .select('id')
          .single();

        if (inserted) {
          competitorIdMap.set(lowerName, inserted.id);
        }
      }
    }

    // --- Step 3: Insert competitor_snapshots ---
    const mentionCounts = new Map<string, number>(); // lowercase name → count
    for (const competitors of resultCompetitors.values()) {
      const seen = new Set<string>();
      for (const c of competitors) {
        const key = c.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          mentionCounts.set(key, (mentionCounts.get(key) ?? 0) + 1);
        }
      }
    }

    const totalPrompts = results.length;
    const snapshots = Array.from(mentionCounts.entries()).map(([lowerName, count]) => ({
      audit_id,
      competitor_id: competitorIdMap.get(lowerName) ?? null,
      competitor_name: (() => {
        // Find properly-cased name
        for (const competitors of resultCompetitors.values()) {
          const match = competitors.find((c) => c.name.toLowerCase() === lowerName);
          if (match) return match.name;
        }
        return lowerName;
      })(),
      mention_count: count,
      mention_frequency: count / totalPrompts,
    }));

    if (snapshots.length > 0) {
      await admin.from('competitor_snapshots').insert(snapshots);
    }

    return NextResponse.json({
      competitors_found: allCompetitors.size,
      audit_id,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
