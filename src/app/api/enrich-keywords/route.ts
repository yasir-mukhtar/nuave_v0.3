import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const GEO_TARGETS: Record<string, string> = {
  id: "geoTargetConstants/2360",  // Indonesia
  ms: "geoTargetConstants/2458",  // Malaysia
  en: "geoTargetConstants/2840",  // US
};

const LANG_CONSTANTS: Record<string, string> = {
  id: "languageConstants/1023",   // Indonesian
  ms: "languageConstants/1102",   // Malay
  en: "languageConstants/1000",   // English
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const GOOGLE_ADS_API_VERSION = "v18";

function isIndonesian(keyword: string): boolean {
  const idIndicators = /\b(untuk|terbaik|apa|yang|cara|bagaimana|dimana|berapa|jasa|murah|rekomendasi|bisnis|usaha|harga|gratis|online|indonesia)\b/i;
  return idIndicators.test(keyword);
}

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OAuth token refresh failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

interface KeywordMetricsResult {
  text?: string;
  keywordMetrics?: {
    avgMonthlySearches?: string;
    competition?: string;
    competitionIndex?: string;
    lowTopOfPageBidMicros?: string;
    highTopOfPageBidMicros?: string;
  };
}

async function fetchKeywordMetrics(
  accessToken: string,
  keywords: string[],
  geoTarget: string,
  languageConstant: string,
): Promise<KeywordMetricsResult[]> {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!;
  const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}:generateKeywordHistoricalMetrics`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      keywords,
      geoTargetConstants: [geoTarget],
      keywordPlanNetwork: "GOOGLE_SEARCH",
      language: languageConstant,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Ads API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.results || [];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ success: false, error: "project_id is required" }, { status: 400 });
    }

    // Check required env vars
    if (!process.env.GOOGLE_ADS_CLIENT_ID || !process.env.GOOGLE_ADS_CLIENT_SECRET ||
        !process.env.GOOGLE_ADS_DEVELOPER_TOKEN || !process.env.GOOGLE_ADS_CUSTOMER_ID ||
        !process.env.GOOGLE_ADS_REFRESH_TOKEN) {
      console.error("Google Ads API environment variables not configured");
      return NextResponse.json({ success: false, error: "Google Ads API not configured" }, { status: 500 });
    }

    const supabase = createSupabaseAdminClient();

    // Fetch prompts that need enrichment
    const { data: prompts, error: fetchError } = await supabase
      .from("prompts")
      .select("id, core_keyword, language, keyword_data_fetched_at")
      .eq("project_id", project_id)
      .not("core_keyword", "is", null);

    if (fetchError || !prompts || prompts.length === 0) {
      return NextResponse.json({ success: true, enriched_count: 0, no_data_count: 0, message: "No prompts to enrich" });
    }

    // Filter to only prompts needing enrichment (null or older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
    const needsEnrichment = prompts.filter((p) => {
      if (!p.keyword_data_fetched_at) return true;
      return new Date(p.keyword_data_fetched_at).getTime() < new Date(thirtyDaysAgo).getTime();
    });

    if (needsEnrichment.length === 0) {
      return NextResponse.json({ success: true, enriched_count: 0, no_data_count: 0, message: "All prompts already enriched" });
    }

    // Get project language for geo targeting
    const { data: project } = await supabase
      .from("projects")
      .select("language")
      .eq("id", project_id)
      .maybeSingle();

    const wsLang = project?.language || "id";
    const geoTarget = GEO_TARGETS[wsLang] || GEO_TARGETS.id;

    // Split keywords by detected language
    const uniqueKeywords = [...new Set(needsEnrichment.map((p) => p.core_keyword).filter(Boolean))] as string[];
    const idKeywords = uniqueKeywords.filter((k) => isIndonesian(k));
    const enKeywords = uniqueKeywords.filter((k) => !isIndonesian(k));

    // Get OAuth access token
    const accessToken = await getAccessToken();

    // Build metrics map from API responses
    const metricsMap = new Map<string, { volume: number; competition: string | null; cpc: number | null }>();

    // Fetch English keywords
    if (enKeywords.length > 0) {
      try {
        const results = await fetchKeywordMetrics(accessToken, enKeywords, geoTarget, LANG_CONSTANTS.en);
        for (const r of results) {
          if (r.text && r.keywordMetrics) {
            metricsMap.set(r.text.toLowerCase(), {
              volume: r.keywordMetrics.avgMonthlySearches ? Number(r.keywordMetrics.avgMonthlySearches) : 0,
              competition: r.keywordMetrics.competition ?? null,
              cpc: r.keywordMetrics.highTopOfPageBidMicros ? Number(r.keywordMetrics.highTopOfPageBidMicros) : null,
            });
          }
        }
      } catch (err) {
        console.error("Google Ads API error (English keywords):", err);
      }
    }

    // Fetch Indonesian keywords
    if (idKeywords.length > 0) {
      try {
        const results = await fetchKeywordMetrics(accessToken, idKeywords, geoTarget, LANG_CONSTANTS.id);
        for (const r of results) {
          if (r.text && r.keywordMetrics) {
            metricsMap.set(r.text.toLowerCase(), {
              volume: r.keywordMetrics.avgMonthlySearches ? Number(r.keywordMetrics.avgMonthlySearches) : 0,
              competition: r.keywordMetrics.competition ?? null,
              cpc: r.keywordMetrics.highTopOfPageBidMicros ? Number(r.keywordMetrics.highTopOfPageBidMicros) : null,
            });
          }
        }
      } catch (err) {
        console.error("Google Ads API error (Indonesian keywords):", err);
      }
    }

    // Update prompts in DB
    let enrichedCount = 0;
    let noDataCount = 0;
    const now = new Date().toISOString();

    for (const prompt of needsEnrichment) {
      if (!prompt.core_keyword) continue;
      const keyLower = prompt.core_keyword.toLowerCase();
      const data = metricsMap.get(keyLower);

      if (data && data.volume > 0) {
        await supabase
          .from("prompts")
          .update({
            search_volume: data.volume,
            competition_level: data.competition,
            cpc_micros: data.cpc,
            keyword_data_fetched_at: now,
          })
          .eq("id", prompt.id);
        enrichedCount++;
      } else {
        await supabase
          .from("prompts")
          .update({ keyword_data_fetched_at: now })
          .eq("id", prompt.id);
        noDataCount++;
      }
    }

    return NextResponse.json({
      success: true,
      enriched_count: enrichedCount,
      no_data_count: noDataCount,
      total_keywords: uniqueKeywords.length,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Keyword enrichment failed:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
