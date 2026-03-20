import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

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

    // Verify ownership
    const admin = createSupabaseAdminClient();
    const { data: proj } = await admin
      .from("projects")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!proj || proj.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only allow updating specific fields
    const allowed = ["name", "website_url", "company_overview", "differentiators", "competitors"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await admin
      .from("projects")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Project update error:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH project error:", err);
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

    // Verify ownership
    const { data: proj } = await admin
      .from("projects")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!proj || proj.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete cascade: recommendations → audit_results → audits → prompts → project
    const { data: audits } = await admin
      .from("audits")
      .select("id")
      .eq("project_id", id);

    if (audits && audits.length > 0) {
      const auditIds = audits.map((a) => a.id);
      await admin.from("recommendations").delete().in("audit_id", auditIds);
      await admin.from("audit_results").delete().in("audit_id", auditIds);
      await admin.from("audits").delete().eq("project_id", id);
    }

    await admin.from("prompts").delete().eq("project_id", id);
    await admin.from("projects").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE project error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
