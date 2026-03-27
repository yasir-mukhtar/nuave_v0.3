import { createHash } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

/* ── Constants ── */

const BATCH_SIZE = 20;
const PARALLEL_BATCHES = 3;

const VALID_SEVERITIES = new Set(['high', 'medium', 'low']);
const VALID_PROBLEM_TYPES = new Set([
  'missing_schema',
  'weak_brand_entity',
  'no_content_coverage',
  'negative_sentiment',
  'competitor_dominance',
  'poor_page_structure',
  'missing_faq',
  'weak_trust_signals',
]);

/* ── Types ── */

interface ExtractedProblem {
  problem_type: string;
  severity: string;
  title: string;
  description: string;
}

interface AuditResult {
  id: string;
  prompt_text: string;
  ai_response: string;
  brand_mentioned: boolean;
}

interface BrandContext {
  name: string;
  website_url: string | null;
  industry: string | null;
}

/* ── Helpers ── */

/** Lazy singleton — avoids crashing at import time if ANTHROPIC_API_KEY is unset. */
let _anthropic: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return _anthropic;
}

function computeProblemKey(promptText: string, problemType: string): string {
  const hash = createHash('sha256').update(promptText).digest('hex').slice(0, 12);
  return `${hash}::${problemType}`;
}

/** Validate and normalise a single problem from Claude's response. Returns null if invalid. */
function validateProblem(raw: ExtractedProblem): ExtractedProblem | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!VALID_SEVERITIES.has(raw.severity)) return null;
  if (!VALID_PROBLEM_TYPES.has(raw.problem_type)) return null;
  if (typeof raw.title !== 'string' || raw.title.length === 0) return null;
  if (typeof raw.description !== 'string') return null;

  return {
    problem_type: raw.problem_type,
    severity: raw.severity as 'high' | 'medium' | 'low',
    title: raw.title.slice(0, 120),
    description: raw.description.slice(0, 500),
  };
}

/* ── Batch processing ── */

/**
 * Send one batch of audit results to Claude for problem extraction,
 * then upsert the returned problems into the database.
 */
async function processBatch(
  batch: AuditResult[],
  brand: BrandContext,
  auditId: string,
  brandId: string,
  admin: ReturnType<typeof createSupabaseAdminClient>,
): Promise<number> {
  const payload = batch.map((r) => ({
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
${JSON.stringify(payload, null, 2)}

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

  const response = await getAnthropicClient().messages.create({
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
    console.error('[problems] Failed to parse Claude JSON:', rawText.slice(0, 500));
    return 0;
  }

  // Upsert each validated problem (SELECT-then-INSERT/UPDATE preserves first_seen_audit_id)
  let count = 0;

  for (const result of batch) {
    const rawProblems = parsed[result.id];
    if (!rawProblems || !Array.isArray(rawProblems)) continue;

    for (const raw of rawProblems) {
      const problem = validateProblem(raw);
      if (!problem) continue;

      const problemKey = computeProblemKey(result.prompt_text ?? '', problem.problem_type);

      const { data: existing } = await admin
        .from('audit_problems')
        .select('id')
        .eq('brand_id', brandId)
        .eq('problem_key', problemKey)
        .maybeSingle();

      if (existing) {
        await admin
          .from('audit_problems')
          .update({
            last_seen_audit_id: auditId,
            audit_result_id: result.id,
            severity: problem.severity,
            title: problem.title,
            description: problem.description,
            status: 'unresolved',
          })
          .eq('id', existing.id);
      } else {
        await admin
          .from('audit_problems')
          .insert({
            audit_id: auditId,
            audit_result_id: result.id,
            brand_id: brandId,
            problem_key: problemKey,
            severity: problem.severity,
            problem_type: problem.problem_type,
            title: problem.title,
            description: problem.description,
            status: 'unresolved',
            first_seen_audit_id: auditId,
            last_seen_audit_id: auditId,
          });
      }

      count++;
    }
  }

  return count;
}

/* ── Public API ── */

/**
 * Analyse all audit results for the given audit and extract problems using Claude.
 *
 * - Batches results (BATCH_SIZE at a time) and processes up to PARALLEL_BATCHES concurrently.
 * - Uses the Supabase admin client internally — no user auth required.
 * - Safe to call from both the background audit pipeline and the authenticated API route.
 */
export async function extractProblemsForAudit(
  auditId: string,
  brandId: string,
): Promise<number> {
  const admin = createSupabaseAdminClient();

  const { data: brand, error: brandError } = await admin
    .from('brands')
    .select('name, website_url, industry')
    .eq('id', brandId)
    .single();

  if (brandError || !brand) {
    console.error('[problems] Brand not found:', brandId);
    return 0;
  }

  const { data: results, error: resultsError } = await admin
    .from('audit_results')
    .select('id, prompt_text, ai_response, brand_mentioned')
    .eq('audit_id', auditId)
    .order('created_at', { ascending: true });

  if (resultsError || !results || results.length === 0) {
    return 0;
  }

  // Split into batches of BATCH_SIZE
  const batches: AuditResult[][] = [];
  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    batches.push(results.slice(i, i + BATCH_SIZE));
  }

  // Process in parallel groups of PARALLEL_BATCHES
  let totalFound = 0;

  for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
    const group = batches.slice(i, i + PARALLEL_BATCHES);
    const settled = await Promise.allSettled(
      group.map((batch) => processBatch(batch, brand, auditId, brandId, admin))
    );

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        totalFound += result.value;
      } else {
        console.error('[problems] Batch failed:', result.reason);
      }
    }
  }

  return totalFound;
}
