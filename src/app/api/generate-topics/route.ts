import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand_name, company_overview, industry, language, project_id } = body;

    if (!brand_name) {
      return NextResponse.json({ success: false, error: "brand_name is required" }, { status: 400 });
    }

    // If project_id provided, check for existing topics first
    if (project_id) {
      const supabase = createSupabaseAdminClient();
      const { data: project } = await supabase
        .from("projects")
        .select("topics")
        .eq("id", project_id)
        .maybeSingle();

      if (project?.topics && Array.isArray(project.topics) && project.topics.length > 0) {
        return NextResponse.json({ success: true, topics: project.topics, cached: true });
      }
    }

    // Generate new topics via AI
    const langLabel = language === "id" ? "Bahasa Indonesia" : language === "ms" ? "Malay" : "English";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an AI visibility strategist. Given a brand profile, suggest exactly 3 audit topics that represent key areas where the brand should appear in AI search results. Each topic should be a short phrase (3-6 words) in ${langLabel}. Return ONLY a JSON array of strings, no explanation.`,
        },
        {
          role: "user",
          content: `Brand: ${brand_name}\nIndustry: ${industry || "unknown"}\nOverview: ${company_overview || "N/A"}\n\nSuggest 3 audit topics in ${langLabel}.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "[]";
    let topics: string[];
    try {
      topics = JSON.parse(raw.replace(/```json?\n?/g, "").replace(/```/g, ""));
    } catch {
      topics = raw.split("\n").filter(Boolean).map(t => t.replace(/^[\d.\-*"]+\s*/, "").replace(/"/g, "").trim()).filter(Boolean).slice(0, 3);
    }

    topics = topics.slice(0, 3);

    // Save to project if project_id provided
    if (project_id && topics.length > 0) {
      const supabase = createSupabaseAdminClient();
      const { error: updateError } = await supabase
        .from("projects")
        .update({ topics })
        .eq("id", project_id);

      if (updateError) {
        console.error("Failed to save topics to project:", updateError);
      }
    }

    return NextResponse.json({ success: true, topics });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
