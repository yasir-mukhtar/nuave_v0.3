import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

// HEAD /api/brands/[id] — lightweight existence check used by the new-project cache guard
export async function HEAD(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("brands").select("id").eq("id", id).maybeSingle();
  return new NextResponse(null, { status: data ? 200 : 404 });
}

// v3: ownership is verified via workspace_members (not brands.user_id)
async function verifyBrandOwnership(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  brandId: string,
  userId: string
): Promise<boolean> {
  const { data: brand } = await admin
    .from("brands")
    .select("workspace_id")
    .eq("id", brandId)
    .maybeSingle();

  if (!brand) return false;

  const { data: membership } = await admin
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", brand.workspace_id)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(membership);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    if (!(await verifyBrandOwnership(admin, id, user.id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only allow updating specific brand fields
    const allowed = ["name", "website_url", "company_overview", "differentiators", "industry", "target_audience", "language"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await admin
      .from("brands")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Brand update error:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH brand error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    if (!(await verifyBrandOwnership(admin, id, user.id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // v3: cascade is handled by DB (ON DELETE CASCADE on all brand_id FKs),
    // but we delete manually here to be explicit and avoid partial failures.

    // 1. Collect audit IDs for this brand
    const { data: audits } = await admin
      .from("audits")
      .select("id")
      .eq("brand_id", id);

    if (audits && audits.length > 0) {
      const auditIds = audits.map(a => a.id);
      await admin.from("audit_results").delete().in("audit_id", auditIds);
    }

    // 2. Delete in FK dependency order
    await admin.from("recommendations").delete().eq("brand_id", id);
    await admin.from("audits").delete().eq("brand_id", id);
    await admin.from("prompts").delete().eq("brand_id", id);
    await admin.from("topics").delete().eq("brand_id", id);
    await admin.from("brand_competitors").delete().eq("brand_id", id);
    await admin.from("brands").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE brand error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
