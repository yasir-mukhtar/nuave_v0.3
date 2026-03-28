/**
 * Shared audit engine — prompt execution, brand detection, batch processing.
 * Used by both manual audits (/api/run-audit) and daily monitoring (/api/cron/monitoring).
 */

import { createSupabaseAdminClient } from '@/lib/supabase/server';

// ── Constants ──────────────────────────────────────────────────
export const OPENAI_MODEL = 'gpt-4o-2024-11-20';
export const CONCURRENCY = 10; // max parallel OpenAI calls per batch
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Types ──────────────────────────────────────────────────────
export interface PromptInput {
  id: string;
  prompt_text: string;
  stage: string;
  language: string;
}

export interface AuditResultRow {
  audit_id: string;
  prompt_id: string | null;
  prompt_text: string;
  ai_response: string;
  ai_model?: string;
  brand_mentioned: boolean;
  mention_context: string | null;
  mention_sentiment: string;
  competitor_mentions: string[];
  position_rank: null;
}

export interface PromptResult {
  row: AuditResultRow;
  mentioned: boolean;
}

// ── Single prompt execution ────────────────────────────────────
export async function runSinglePrompt(
  prompt: PromptInput,
  auditId: string,
  brandLower: string,
  brandNoSpaces: string,
): Promise<PromptResult> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0,
      input: prompt.prompt_text,
      tools: [{
        type: 'web_search_preview',
        user_location: {
          type: 'approximate',
          country: prompt.language === 'ms' ? 'MY' : 'ID',
          city: prompt.language === 'ms' ? 'Kuala Lumpur' : 'Jakarta',
        },
        search_context_size: 'medium',
      }],
    }),
  });

  const data = await response.json();

  let responseText = '';
  if (data.output && Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item.type === 'message' && item.content) {
        for (const content of item.content) {
          if (content.type === 'output_text' && content.text) {
            responseText = content.text;
            break;
          }
        }
      }
    }
  }

  const { mentioned, context } = detectBrandMention(responseText, brandLower, brandNoSpaces);

  return {
    mentioned,
    row: {
      audit_id: auditId,
      prompt_id: UUID_RE.test(prompt.id) ? prompt.id : null,
      prompt_text: prompt.prompt_text,
      ai_response: responseText,
      ai_model: OPENAI_MODEL,
      brand_mentioned: mentioned,
      mention_context: context,
      mention_sentiment: 'positive',
      competitor_mentions: [],
      position_rank: null,
    },
  };
}

// ── Brand mention detection ────────────────────────────────────
export function detectBrandMention(
  responseText: string,
  brandLower: string,
  brandNoSpaces: string,
): { mentioned: boolean; context: string | null } {
  const responseLower = responseText.toLowerCase();
  let mentioned = responseLower.includes(brandLower);
  if (!mentioned && brandLower.includes(' ')) {
    mentioned = responseLower.includes(brandNoSpaces);
  }

  let context: string | null = null;
  if (mentioned) {
    let index = responseLower.indexOf(brandLower);
    let matchLength = brandLower.length;
    if (index === -1 && brandLower.includes(' ')) {
      index = responseLower.indexOf(brandNoSpaces);
      matchLength = brandNoSpaces.length;
    }
    if (index !== -1) {
      const start = Math.max(0, index - 100);
      const end = Math.min(responseText.length, index + matchLength + 100);
      context = responseText.substring(start, end);
    }
  }

  return { mentioned, context };
}

// ── Batch processing ───────────────────────────────────────────
/**
 * Run all prompts in parallel batches, insert results into audit_results,
 * and return the aggregated rows + mention count.
 */
export async function processPromptBatches(
  auditId: string,
  prompts: PromptInput[],
  brandName: string,
): Promise<{ allRows: AuditResultRow[]; totalMentions: number }> {
  const supabase = createSupabaseAdminClient();
  const brandLower = brandName.trim().toLowerCase();
  const brandNoSpaces = brandLower.replace(/\s+/g, '');

  const allRows: AuditResultRow[] = [];
  let totalMentions = 0;

  for (let i = 0; i < prompts.length; i += CONCURRENCY) {
    const batch = prompts.slice(i, i + CONCURRENCY);

    const results = await Promise.allSettled(
      batch.map(p => runSinglePrompt(p, auditId, brandLower, brandNoSpaces))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allRows.push(result.value.row);
        if (result.value.mentioned) totalMentions++;
      }
    }

    // Insert batch results immediately so polling progress updates
    const batchRows = results
      .filter((r): r is PromiseFulfilledResult<PromptResult> => r.status === 'fulfilled')
      .map(r => r.value.row);

    if (batchRows.length > 0) {
      await supabase.from('audit_results').insert(batchRows);
    }
  }

  return { allRows, totalMentions };
}

// ── Competitor extraction (internal API call) ──────────────────
export async function extractCompetitors(auditId: string): Promise<{ ok: boolean; error?: string }> {
  const internalBase = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${process.env.PORT || 3000}`;

  const res = await fetch(`${internalBase}/api/competitors/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audit_id: auditId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown');
    return { ok: false, error: `${res.status}: ${text}` };
  }

  return { ok: true };
}

// ── Visibility score calculation ───────────────────────────────
export function calculateVisibilityScore(mentions: number, totalPrompts: number): number {
  return totalPrompts > 0 ? Math.round((mentions / totalPrompts) * 100) : 0;
}
