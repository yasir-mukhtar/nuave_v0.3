import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand_name, topics, language, workspace_id } = body;

    if (!brand_name || !topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json({ success: false, error: "brand_name and topics are required" }, { status: 400 });
    }

    // If workspace_id provided, check for existing prompts first
    if (workspace_id) {
      const supabase = createSupabaseAdminClient();
      const { data: existing } = await supabase
        .from("prompts")
        .select("prompt_text, core_keyword, demand_tier, topic, display_order")
        .eq("workspace_id", workspace_id)
        .order("display_order", { ascending: true });

      if (existing && existing.length > 0) {
        // Reconstruct the topic-grouped response from stored prompts
        const result: Record<string, Array<{ text: string; core_keyword: string; demand_tier: string }>> = {};
        for (const row of existing) {
          const topicName = row.topic || "General";
          if (!result[topicName]) result[topicName] = [];
          result[topicName].push({
            text: row.prompt_text,
            core_keyword: row.core_keyword || "",
            demand_tier: row.demand_tier || "medium",
          });
        }
        return NextResponse.json({ success: true, prompts: result, cached: true });
      }
    }

    // Generate new prompts via AI
    const langLabel = language === "id" ? "Bahasa Indonesia" : language === "ms" ? "Malay" : "English";
    const topicList = topics.map((t: string, i: number) => `${i + 1}. ${t}`).join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an AI visibility strategist. Given a brand name and a list of audit topics, generate exactly 5 realistic search prompts per topic that a real user would ask an AI assistant. Prompts should be in ${langLabel}. NEVER mention the brand name "${brand_name}" in any prompt.

For each prompt, also provide:
- "core_keyword": A short (2-5 word) keyword phrase that captures the search intent. This should be what someone would type into Google. Use the language of the prompt. Examples: "best POS system restaurant", "software akuntansi UMKM".
- "demand_tier": Estimate the relative search demand:
  - "high": Decision-stage queries in competitive industries, clear commercial intent, popular categories
  - "medium": Consideration-stage queries, industry-specific but not hyper-niche
  - "low": Awareness-stage queries in niche industries, very long-tail, emerging categories

Return ONLY a JSON object where keys are topic names and values are arrays of 5 objects with "text", "core_keyword", and "demand_tier" fields. No explanation.`,
        },
        {
          role: "user",
          content: `Brand: ${brand_name}\n\nTopics:\n${topicList}\n\nGenerate 5 prompts per topic in ${langLabel}.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let result: Record<string, Array<{ text: string; core_keyword: string; demand_tier: string } | string>>;
    try {
      result = JSON.parse(raw.replace(/```json?\n?/g, "").replace(/```/g, ""));
    } catch {
      result = {};
      for (const t of topics) {
        result[t] = [];
      }
    }

    // Enforce max 5 prompts per topic
    for (const key of Object.keys(result)) {
      if (result[key].length > 5) {
        result[key] = result[key].slice(0, 5);
      }
    }

    // Save to DB if workspace_id provided
    if (workspace_id) {
      const supabase = createSupabaseAdminClient();
      const rows: {
        workspace_id: string;
        prompt_text: string;
        core_keyword: string | null;
        demand_tier: string;
        topic: string;
        display_order: number;
        stage: string;
        language: string;
        is_active: boolean;
      }[] = [];

      let order = 0;
      for (const [topicName, prompts] of Object.entries(result)) {
        for (const item of prompts) {
          const text = typeof item === "string" ? item : item.text;
          const coreKeyword = typeof item === "string" ? null : item.core_keyword;
          const demandTier = typeof item === "string" ? "medium" : (item.demand_tier || "medium");
          rows.push({
            workspace_id,
            prompt_text: text,
            core_keyword: coreKeyword,
            demand_tier: demandTier,
            topic: topicName,
            display_order: order++,
            stage: "awareness",
            language: language || "id",
            is_active: true,
          });
        }
      }

      if (rows.length > 0) {
        const { error: insertError } = await supabase.from("prompts").insert(rows);
        if (insertError) {
          console.error("Failed to save draft prompts:", insertError);
          // Non-fatal — prompts still returned to client
        }
      }
    }

    return NextResponse.json({ success: true, prompts: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
