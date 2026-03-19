import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand_name, company_overview, industry, language } = body;

    if (!brand_name) {
      return NextResponse.json({ success: false, error: "brand_name is required" }, { status: 400 });
    }

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

    return NextResponse.json({ success: true, topics: topics.slice(0, 3) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
