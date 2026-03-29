import OpenAI from "openai";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { getOrgPlan, checkCreateBrand } from "@/lib/plan-gate";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ScrapeRequestBody {
  website_url: string;
  brand_name?: string;
  workspace_id?: string;
}

interface CompanyProfile {
  brand_name: string;
  parent_brand: string;
  company_overview: string;
  industry: string;
  differentiators: string[];
  competitors: string[];
  target_audience?: string;
  language?: string;
  website_url?: string;
}

function ensureStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string" && val.trim()) return [val];
  return [];
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
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
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

  const { website_url, brand_name, workspace_id } = body;

  if (!website_url) {
    return NextResponse.json({ error: "website_url is required" }, { status: 400 });
  }

  try {
    new URL(website_url);
  } catch {
    return NextResponse.json({ error: "website_url must be a valid URL" }, { status: 400 });
  }

  // Authenticate and check plan BEFORE any AI calls to avoid wasting tokens
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminClient = createSupabaseAdminClient();

  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated. Please sign in and try again.' },
      { status: 401 }
    );
  }

  const orgPlan = await getOrgPlan(adminClient, user.id);
  if (!orgPlan) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  const brandAccess = await checkCreateBrand(adminClient, orgPlan);
  if (!brandAccess.allowed) {
    return NextResponse.json(
      { error: brandAccess.reason, upgradeTarget: brandAccess.upgradeTarget },
      { status: 403 }
    );
  }

  let websiteContent: string | null = null;
  try {
    const content = await fetchWebsiteContent(website_url);
    if (content && content.length >= 50) websiteContent = content;
  } catch {
    // fallback to knowledge prompt
  }

  const userPrompt = websiteContent
    ? `Analyze this website content and extract:
- brand_name: the specific product, service, or model name shown on this page${brand_name ? ` (hint: it may be "${brand_name}")` : ""}
- parent_brand: the umbrella company or brand that owns this product/service (e.g. if brand_name is "Philips FC9330/09", parent_brand is "Philips". If brand_name is the same as the company, use the same value for both)
- company_overview: 2-3 sentence description of what they do
- industry: one word industry category
- differentiators: array of 3-5 unique value propositions (short phrases, max 4 words each)
- competitors: array of 2-4 competitor company names

Website content:
${websiteContent}

Respond with a single valid JSON object containing exactly these keys: brand_name, parent_brand, company_overview, industry, differentiators, competitors. No markdown, no explanation, no extra text.`
    : `Based on your knowledge of this company, extract:
brand_name (specific product/service/model), parent_brand (umbrella company), company_overview, industry, differentiators, competitors, target_audience, language.

If brand_name and parent_brand are the same company, use the same value for both.

Company website: ${website_url}
${brand_name ? `Brand name: ${brand_name}` : ""}

Respond with JSON only, same format as before.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a business analyst. Extract structured information from website content. Always respond with valid JSON only, no markdown, no explanation.",
        },
        { role: "user", content: userPrompt },
      ],
    });

    const responseText = completion.choices[0].message.content ?? "";

    let profile: CompanyProfile;
    try {
      profile = JSON.parse(responseText) as CompanyProfile;
      profile.website_url = website_url;
    } catch {
      console.error("GPT-4o JSON parse failed. Raw response:", responseText);
      return NextResponse.json(
        { error: "GPT-4o returned invalid JSON", raw: responseText },
        { status: 500 }
      );
    }

    // Normalize — GPT sometimes returns strings instead of arrays
    profile.differentiators = ensureStringArray(profile.differentiators);
    profile.competitors = ensureStringArray(profile.competitors);

    const brandId = randomUUID();

    // Resolve workspace from DB — never trust client-provided workspace_id
    const { data: wm } = await adminClient
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    const resolvedWsId = wm?.workspace_id;

    if (!resolvedWsId) {
      console.error('No workspace found for user', user.id);
      return NextResponse.json(
        { error: 'No workspace found. Please sign in and try again.' },
        { status: 400 }
      );
    }

    // Determine if profile is complete enough to set onboarding_completed_at
    const hasOverview = Boolean(profile.company_overview);
    const hasDifferentiators = profile.differentiators.length > 0;
    const hasCompetitors = profile.competitors.length > 0;
    const isOnboardingComplete = hasOverview && hasDifferentiators && hasCompetitors;

    const { error: brandError } = await adminClient
      .from('brands')
      .insert({
        id: brandId,
        workspace_id: resolvedWsId,
        created_by: user?.id ?? null,
        name: profile.brand_name,
        website_url,
        company_overview: profile.company_overview || null,
        industry: profile.industry || null,
        differentiators: profile.differentiators,
        target_audience: profile.target_audience || null,
        language: profile.language || 'id',
        onboarding_completed_at: isOnboardingComplete ? new Date().toISOString() : null,
      });

    if (brandError) {
      console.error('Brand insert failed:', JSON.stringify(brandError));
      return NextResponse.json(
        { error: `Failed to save brand: ${brandError.message}` },
        { status: 500 }
      );
    }

    // Update workspace name to parent brand if still default
    const parentBrand = profile.parent_brand || profile.brand_name;
    if (parentBrand) {
      const { data: ws } = await adminClient
        .from('workspaces')
        .select('name')
        .eq('id', resolvedWsId)
        .single();

      // Only update if workspace has a default/generic name
      const isDefault = !ws?.name || ws.name === 'My Workspace' || ws.name === 'default';
      if (isDefault) {
        await adminClient
          .from('workspaces')
          .update({ name: parentBrand, updated_at: new Date().toISOString() })
          .eq('id', resolvedWsId);
      }
    }

    const competitorNames = profile.competitors;
    if (competitorNames.length > 0) {
      const competitorRows = competitorNames.map(name => ({
        brand_id: brandId,
        name,
      }));
      const { error: compError } = await adminClient
        .from('brand_competitors')
        .insert(competitorRows);
      if (compError) {
        console.error('Competitors insert failed:', JSON.stringify(compError));
      }
    }

    return NextResponse.json({
      success: true,
      source: websiteContent ? "scraped" : "knowledge",
      website_url,
      brand_id: brandId,
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
