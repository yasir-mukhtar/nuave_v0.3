import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ScrapeRequestBody {
  website_url: string;
  brand_name?: string;
}

interface CompanyProfile {
  brand_name: string;
  company_overview: string;
  industry: string;
  differentiators: string[];
  competitors: string[];
  target_audience?: string;
  language?: string;
  website_url?: string;
}

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
    const text = html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  let body: ScrapeRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { website_url, brand_name } = body;

  if (!website_url) {
    return NextResponse.json(
      { error: "website_url is required" },
      { status: 400 }
    );
  }

  try {
    new URL(website_url);
  } catch {
    return NextResponse.json(
      { error: "website_url must be a valid URL" },
      { status: 400 }
    );
  }

  let websiteContent: string | null = null;
  try {
    const content = await fetchWebsiteContent(website_url);
    if (content && content.length >= 50) {
      websiteContent = content;
    }
  } catch {
    // fallback to knowledge prompt
  }

  const userPrompt = websiteContent
    ? `Analyze this website content and extract:
- brand_name: the company name${brand_name ? ` (hint: it may be "${brand_name}")` : ""}
- company_overview: 2-3 sentence description of what they do
- industry: one word industry category
- differentiators: array of 3-5 unique value propositions (short phrases, max 4 words each)
- competitors: array of 2-4 competitor company names

Website content:
${websiteContent}

Respond with a single valid JSON object containing exactly these keys: brand_name, company_overview, industry, differentiators, competitors. No markdown, no explanation, no extra text.`
    : `Based on your knowledge of this company, extract:
brand_name, company_overview, industry, differentiators, competitors, target_audience, language.

Company website: ${website_url}
${brand_name ? `Brand name: ${brand_name}` : ""}

Respond with JSON only, same format as before.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: "You are a business analyst. Extract structured information from website content. Always respond with valid JSON only, no markdown, no explanation.",
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const responseText = completion.choices[0].message.content ?? "";
    const cleaned = responseText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let profile: CompanyProfile;
    try {
      profile = JSON.parse(cleaned) as CompanyProfile;
      profile.website_url = website_url;
    } catch {
      return NextResponse.json(
        { error: "GPT-4o returned invalid JSON", raw: responseText },
        { status: 500 }
      );
    }

    // Get the authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Use admin client for the INSERT to bypass RLS
    const adminClient = createSupabaseAdminClient();
    const { data: workspaceRows, error: wsError } = await adminClient
      .from('workspaces')
      .insert({
        user_id: user?.id || null,
        brand_name: profile.brand_name,
        website_url: website_url,
        company_overview: profile.company_overview || null,
        industry: profile.industry || null,
        differentiators: profile.differentiators || [],
        competitors: profile.competitors || [],
        target_audience: profile.target_audience || null,
        language: profile.language || 'en',
      })
      .select('id');

    const workspace = workspaceRows?.[0] || null;

    if (wsError) {
      console.error('Workspace insert failed:', wsError);
    }

    return NextResponse.json({
      success: true,
      source: websiteContent ? "scraped" : "knowledge",
      website_url,
      workspace_id: workspace?.id || null,
      profile,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `OpenAI API error: ${message}` },
      { status: 500 }
    );
  }
}
