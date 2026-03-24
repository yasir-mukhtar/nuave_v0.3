// Used by the onboarding flow (/onboarding/profile).
// v3: writes to brands table and prompts table (brand_id, no project_id / topic_id).
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Profile {
  brand_name: string;
  company_overview: string;
  industry: string;
  differentiators: string[];
  competitors: string[];
  target_audience?: string;
  language?: string;
  website_url?: string;
}

interface GeneratedPrompt {
  prompt_text: string;
  stage: "awareness" | "consideration" | "decision";
  language: string;
  core_keyword?: string;
  demand_tier?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let body: { brand_id?: string; profile: Profile };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const brand_id = body.brand_id;
  const { profile } = body;

  if (!profile) {
    return NextResponse.json({ error: "profile is required" }, { status: 400 });
  }

  // v3: persist updated profile fields to brands table (not projects)
  if (brand_id) {
    try {
      const adminClient = createSupabaseAdminClient();

      const hasOverview = Boolean(profile.company_overview);
      const hasDifferentiators = (profile.differentiators || []).length > 0;
      const hasCompetitors = (profile.competitors || []).length > 0;
      const isComplete = hasOverview && hasDifferentiators && hasCompetitors;

      await adminClient
        .from('brands')
        .update({
          website_url: profile.website_url || null,
          company_overview: profile.company_overview || null,
          industry: profile.industry || null,
          differentiators: profile.differentiators || [],
          target_audience: profile.target_audience || null,
          language: profile.language || 'id',
          // Set onboarding_completed_at if not already set and profile is now complete
          ...(isComplete ? { onboarding_completed_at: new Date().toISOString() } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', brand_id);

      // v3: upsert competitors to brand_competitors (not brands.competitors[])
      if (hasCompetitors) {
        // Delete old competitors and re-insert (idempotent on profile edit)
        await adminClient.from('brand_competitors').delete().eq('brand_id', brand_id);
        await adminClient.from('brand_competitors').insert(
          profile.competitors.map(name => ({ brand_id, name }))
        );
      }
    } catch (err) {
      console.error("Failed to persist brand profile:", err);
      // Non-fatal, continue with prompt generation
    }
  }

  const localLanguage =
    profile.language === "id"
      ? "Bahasa Indonesia"
      : profile.language === "ms"
      ? "Bahasa Malaysia"
      : "English";

  const userPrompt = `Generate exactly 10 prompts for this company's AEO audit.

Company: ${profile.brand_name}
Industry: ${profile.industry}
Overview: ${profile.company_overview}
Target audience: ${profile.target_audience ?? "general"}

RULES:
- NEVER mention ${profile.brand_name} in any prompt
- Prompts must be problem-first, category-first questions
- Distribution: exactly 3 awareness + 4 consideration + 3 decision
- Language: 7 prompts in English, 3 in ${localLanguage}
- Each prompt should sound like a real user asking ChatGPT

For each prompt, also provide:
- "core_keyword": A short (2-5 word) keyword phrase that captures the search intent. Use the language of the prompt.
- "demand_tier": Estimate relative search demand: "high" (decision-stage, competitive, commercial intent), "medium" (consideration-stage, industry-specific), or "low" (awareness-stage, niche, long-tail)

Return JSON array of 10 objects:
[
  {
    "prompt_text": "the question",
    "stage": "awareness|consideration|decision",
    "language": "en|id|ms",
    "core_keyword": "short keyword phrase",
    "demand_tier": "high|medium|low"
  }
]`;

  let generatedPrompts: GeneratedPrompt[];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2000,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are an AEO (Answer Engine Optimization) specialist. Generate search prompts that real users ask AI tools like ChatGPT. Always respond with valid JSON only, no markdown.",
        },
        { role: "user", content: userPrompt },
      ],
    });

    const rawText = (completion.choices[0].message.content ?? "")
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    try {
      generatedPrompts = JSON.parse(rawText) as GeneratedPrompt[];
    } catch {
      return NextResponse.json(
        { error: "Failed to generate prompts", raw: rawText },
        { status: 500 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate prompts: ${message}` },
      { status: 500 }
    );
  }

  // v3: save to prompts table with brand_id (no project_id, no topic_id for onboarding prompts)
  const rows = generatedPrompts.map((prompt, index) => ({
    brand_id: brand_id ?? null,
    topic_id: null,  // onboarding prompts are uncategorized
    prompt_text: prompt.prompt_text,
    stage: prompt.stage,
    language: prompt.language,
    is_active: true,
    display_order: index + 1,
    core_keyword: prompt.core_keyword || null,
    demand_tier: prompt.demand_tier || "medium",
  }));

  let savedPrompts = rows;

  if (brand_id) {
    try {
      const { data, error } = await supabase
        .from("prompts")
        .insert(rows)
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
      } else if (data) {
        savedPrompts = data;
      }
    } catch (err) {
      console.error("Supabase client error:", err);
    }
  }

  return NextResponse.json({ success: true, prompts: savedPrompts });
}
