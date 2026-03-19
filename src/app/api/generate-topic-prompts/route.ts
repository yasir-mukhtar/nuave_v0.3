import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand_name, topics, language } = body;

    if (!brand_name || !topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json({ success: false, error: "brand_name and topics are required" }, { status: 400 });
    }

    const langLabel = language === "id" ? "Bahasa Indonesia" : language === "ms" ? "Malay" : "English";

    const topicList = topics.map((t: string, i: number) => `${i + 1}. ${t}`).join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an AI visibility strategist. Given a brand name and a list of audit topics, generate exactly 5 realistic search prompts per topic that a real user would ask an AI assistant. Prompts should be in ${langLabel}. Return ONLY a JSON object where keys are topic names and values are arrays of 5 prompt strings. No explanation.`,
        },
        {
          role: "user",
          content: `Brand: ${brand_name}\n\nTopics:\n${topicList}\n\nGenerate 5 prompts per topic in ${langLabel}.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let result: Record<string, string[]>;
    try {
      result = JSON.parse(raw.replace(/```json?\n?/g, "").replace(/```/g, ""));
    } catch {
      // Fallback: create empty structure
      result = {};
      for (const t of topics) {
        result[t] = [];
      }
    }

    return NextResponse.json({ success: true, prompts: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
