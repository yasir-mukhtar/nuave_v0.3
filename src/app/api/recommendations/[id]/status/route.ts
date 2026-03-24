import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["open", "applied", "dismissed", "resolved"] as const;
type RecommendationStatus = (typeof VALID_STATUSES)[number];

const STATUS_TIMESTAMP: Partial<Record<RecommendationStatus, string>> = {
  applied: "applied_at",
  resolved: "resolved_at",
  dismissed: "dismissed_at",
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body as { status: string };

    if (!status || !VALID_STATUSES.includes(status as RecommendationStatus)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      status,
      updated_at: now,
    };

    // Set the relevant timestamp for this status transition
    const timestampField = STATUS_TIMESTAMP[status as RecommendationStatus];
    if (timestampField) {
      updates[timestampField] = now;
    }

    // Clear other status timestamps when reverting to open
    if (status === "open") {
      updates.applied_at = null;
      updates.resolved_at = null;
      updates.dismissed_at = null;
    }

    const { data, error } = await supabase
      .from("recommendations")
      .update(updates)
      .eq("id", id)
      .select("id, status, applied_at, resolved_at, dismissed_at")
      .single();

    if (error) {
      console.error("Recommendation status update error:", error);
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }

    return NextResponse.json({ success: true, recommendation: data });
  } catch (err) {
    console.error("PATCH recommendation status error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
