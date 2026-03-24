import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  // Handle redirect query params first (before auth exchange)
  const pkg  = requestUrl.searchParams.get('package');
  const next = requestUrl.searchParams.get('next');

  if (!code) {
    // No code — just redirect to dashboard (e.g. direct visits to /auth/callback)
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // Use a SINGLE client instance for both exchange + getUser.
  // Creating a second client after exchange misses the freshly-set session cookies.
  const supabase = await createSupabaseServerClient();
  await supabase.auth.exchangeCodeForSession(code);

  // Handle post-login redirects with ?package or ?next params
  if (pkg) {
    return NextResponse.redirect(`${origin}/dashboard/credits?package=${pkg}`);
  }
  if (next && next.startsWith('/')) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Determine new vs returning user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Session exchange failed — send to auth page so they can try again
    return NextResponse.redirect(`${origin}/auth`);
  }

  const adminClient = createSupabaseAdminClient();

  // Find workspaces via membership (v3: no workspaces.user_id)
  const { data: memberships } = await adminClient
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id);

  const wsIds = (memberships || []).map(m => m.workspace_id);

  if (wsIds.length === 0) {
    // Trigger race condition (extremely rare) or trigger failed — send to brand wizard
    return NextResponse.redirect(`${origin}/new-project?new=1`);
  }

  const { count } = await adminClient
    .from('brands')
    .select('id', { count: 'exact', head: true })
    .in('workspace_id', wsIds);

  if (!count || count === 0) {
    // New user — no brands yet → start brand creation wizard
    return NextResponse.redirect(`${origin}/new-project?new=1`);
  }

  // Returning user with existing brands → go to dashboard
  return NextResponse.redirect(`${origin}/dashboard`);
}
