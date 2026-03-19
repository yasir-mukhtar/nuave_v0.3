import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchWebsiteContent(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: HTTP ${response.status}`);
    }

    const html = await response.text();
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // Fetch workspace
    const { data: ws } = await admin
      .from("workspaces")
      .select("*")
      .eq("id", id)
      .single();

    if (!ws || ws.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Scrape website
    let websiteContent: string | null = null;
    try {
      const content = await fetchWebsiteContent(ws.website_url);
      if (content && content.length >= 50) {
        websiteContent = content;
      }
    } catch {
      // fallback to knowledge prompt
    }

    const userPrompt = websiteContent
      ? `Analyze this website content and extract:
- brand_name: the company name (hint: it may be "${ws.brand_name}")
- company_overview: 2-3 sentence description of what they do
- industry: one word industry category
- differentiators: array of 3-5 unique value propositions (short phrases, max 4 words each)
- competitors: array of 2-4 competitor company names

Website content:
${websiteContent}

Respond with a single valid JSON object containing exactly these keys: brand_name, company_overview, industry, differentiators, competitors. No markdown, no explanation, no extra text.`
      : `Based on your knowledge of this company, extract:
brand_name, company_overview, industry, differentiators, competitors.

Company website: ${ws.website_url}
Brand name: ${ws.brand_name}

Respond with JSON only.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: "You are a business analyst. Extract structured information from website content. Always respond with valid JSON only, no markdown, no explanation.",
        },
        { role: "user", content: userPrompt },
      ],
    });

    const responseText = completion.choices[0].message.content ?? "";
    const cleaned = responseText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let profile;
    try {
      profile = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    // Update workspace with fresh data
    const { error } = await admin
      .from("workspaces")
      .update({
        brand_name: profile.brand_name || ws.brand_name,
        company_overview: profile.company_overview || ws.company_overview,
        differentiators: profile.differentiators || ws.differentiators,
        competitors: profile.competitors || ws.competitors,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Rescrape update error:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        brand_name: profile.brand_name || ws.brand_name,
        company_overview: profile.company_overview || ws.company_overview,
        differentiators: profile.differentiators || ws.differentiators,
        competitors: profile.competitors || ws.competitors,
      },
    });
  } catch (err) {
    console.error("Rescrape error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
