import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const brand_id: string | undefined = body.brand_id;
    const { brand_name, company_overview, industry, language } = body;

    if (!brand_name) {
      return NextResponse.json({ success: false, error: "brand_name is required" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // v3: check for existing topics in topics table (not projects.topics JSONB)
    if (brand_id) {
      const { data: existing } = await supabase
        .from("topics")
        .select("id, name, display_order")
        .eq("brand_id", brand_id)
        .order("display_order", { ascending: true });

      if (existing && existing.length > 0) {
        return NextResponse.json({ success: true, topics: existing, cached: true });
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
    let topicNames: string[];
    try {
      topicNames = JSON.parse(raw.replace(/```json?\n?/g, "").replace(/```/g, ""));
    } catch {
      topicNames = raw
        .split("\n")
        .filter(Boolean)
        .map(t => t.replace(/^[\d.\-*"]+\s*/, "").replace(/"/g, "").trim())
        .filter(Boolean)
        .slice(0, 3);
    }

    topicNames = topicNames.slice(0, 3);

    // v3: insert into topics table and return rows with IDs
    if (brand_id && topicNames.length > 0) {
      const rows = topicNames.map((name, i) => ({ brand_id, name, display_order: i }));
      const { data: inserted, error: insertError } = await supabase
        .from("topics")
        .insert(rows)
        .select("id, name, display_order");

      if (insertError) {
        console.error("Failed to save topics:", insertError);
        // Non-fatal — return names without IDs
      } else if (inserted) {
        return NextResponse.json({ success: true, topics: inserted });
      }
    }

    // Fallback: return name-only objects (no brand_id supplied or insert failed)
    const topics = topicNames.map((name, i) => ({ id: null, name, display_order: i }));
    return NextResponse.json({ success: true, topics });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
