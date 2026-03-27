export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { extractProblemsForAudit } from '@/lib/problems';

export async function POST(request: Request) {
  try {
    const { audit_id } = await request.json();

    if (!audit_id) {
      return NextResponse.json({ error: 'audit_id required' }, { status: 400 });
    }

    // Authenticate user
    const serverSupabase = await createSupabaseServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    // Fetch audit + brand profile
    const { data: audit, error: auditError } = await admin
      .from('audits')
      .select('id, brand_id')
      .eq('id', audit_id)
      .single();

    if (auditError || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    const { data: brand, error: brandError } = await admin
      .from('brands')
      .select('id, workspace_id')
      .eq('id', audit.brand_id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Verify user has access to this brand's workspace
    const { data: membership } = await admin
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', brand.workspace_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      // Check org-level access
      const { data: workspace } = await admin
        .from('workspaces')
        .select('org_id')
        .eq('id', brand.workspace_id)
        .single();

      if (workspace) {
        const { data: orgMembership } = await admin
          .from('organization_members')
          .select('user_id')
          .eq('org_id', workspace.org_id)
          .eq('user_id', user.id)
          .in('role', ['owner', 'admin'])
          .maybeSingle();

        if (!orgMembership) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const totalProblemsFound = await extractProblemsForAudit(audit_id, audit.brand_id);

    return NextResponse.json({ problems_found: totalProblemsFound, audit_id });

  } catch (error: unknown) {
    console.error('Problem extraction error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
