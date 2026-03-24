import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

// POST /api/credits/claim-welcome
// Called after brand profile is completed (onboarding_completed_at is set).
// Idempotent — DB function returns -2 if already claimed.
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // Resolve org_id from user membership
    const { data: om } = await admin
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!om?.org_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const orgId = om.org_id;

    // Eligibility check: user must have at least one brand with onboarding_completed_at set
    const { data: memberships } = await admin
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id);

    const wsIds = (memberships ?? []).map(m => m.workspace_id);

    if (wsIds.length === 0) {
      return NextResponse.json(
        { error: "Complete your brand profile before claiming credits." },
        { status: 403 }
      );
    }

    const { count } = await admin
      .from("brands")
      .select("id", { count: "exact", head: true })
      .in("workspace_id", wsIds)
      .not("onboarding_completed_at", "is", null);

    if (!count || count === 0) {
      return NextResponse.json(
        { error: "Complete your brand profile before claiming credits." },
        { status: 403 }
      );
    }

    // Call the idempotent DB function
    const { data: newBalance, error: rpcError } = await admin
      .rpc("claim_welcome_credits", {
        p_org_id: orgId,
        p_actioned_by: user.id,
      });

    if (rpcError) {
      console.error("claim_welcome_credits RPC error:", rpcError);
      return NextResponse.json({ error: "Failed to claim credits." }, { status: 500 });
    }

    if (newBalance === -1) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    if (newBalance === -2) {
      return NextResponse.json(
        { already_claimed: true, message: "Welcome credits already claimed." },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      credits_balance: newBalance,
      message: "10 welcome credits added to your account!",
    });

  } catch (err: any) {
    console.error("claim-welcome error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
