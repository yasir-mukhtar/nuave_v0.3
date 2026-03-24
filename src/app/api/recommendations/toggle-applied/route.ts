import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// Backward-compat shim for old toggle-applied callers.
// New code should use PATCH /api/recommendations/[id]/status instead.
export async function POST(request: Request) {
  try {
    const { recommendation_id, is_applied } = await request.json();

    if (!recommendation_id || typeof is_applied !== "boolean") {
      return NextResponse.json(
        { error: "recommendation_id and is_applied required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();

    // Map is_applied boolean → new status enum
    const status = is_applied ? "applied" : "open";
    const updates: Record<string, unknown> = {
      status,
      updated_at: now,
      applied_at: is_applied ? now : null,
    };

    const { error } = await supabase
      .from("recommendations")
      .update(updates)
      .eq("id", recommendation_id);

    if (error) {
      console.error("Toggle applied error:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Toggle applied API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
