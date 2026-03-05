import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Profile {
  brand_name: string;
  company_overview: string;
  industry: string;
  differentiators: string[];
  competitors: string[];
  target_audience?: string;
  language?: string;
}

interface GeneratedPrompt {
  prompt_text: string;
  stage: "awareness" | "consideration" | "decision";
  language: string;
}

export async function POST(request: NextRequest) {
  let body: { workspace_id: string; profile: Profile };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { workspace_id, profile } = body;

  if (!profile) {
    return NextResponse.json(
      { error: "profile is required" },
      { status: 400 }
    );
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

Return JSON array of 10 objects:
[
  {
    "prompt_text": "the question",
    "stage": "awareness|consideration|decision",
    "language": "en|id|ms"
  }
]`;

  // Step 1: Generate prompts with GPT-4o
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
        {
          role: "user",
          content: userPrompt,
        },
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

  // Step 2: Save to Supabase
  const rows = generatedPrompts.map((prompt, index) => ({
    workspace_id,
    prompt_text: prompt.prompt_text,
    stage: prompt.stage,
    language: prompt.language,
    is_active: true,
    display_order: index + 1,
  }));

  let savedPrompts = rows;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("prompts")
      .insert(rows)
      .select();

    if (error) {
      // 23503 = foreign key violation (workspace_id not in workspaces table — temp UUID)
      if (error.code !== "23503") {
        console.error("Supabase insert error:", error);
      }
    } else if (data) {
      savedPrompts = data;
    }
  } catch (err) {
    console.error("Supabase client error:", err);
  }

  // Step 3: Return response
  return NextResponse.json({ success: true, prompts: savedPrompts });
}
