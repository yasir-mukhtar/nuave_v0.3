import { randomUUID } from "crypto";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { NextResponse } from 'next/server';

function generateSlug(name: string): string {
  const base = (name || "user").split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createSupabaseServerClient();
    const adminClient = createSupabaseAdminClient();

    // Exchange code for session
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code);

    if (user) {
      // Check if user already exists in our users table
      const { data: existingUser } = await adminClient
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      const isNewUser = !existingUser;

      if (isNewUser) {
        // Create users row with upsert (safe against trigger race)
        await adminClient.from('users').upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          credits_balance: 10
        }, { onConflict: 'id' });

        // Log welcome bonus — check for duplicate first
        const { data: existingBonus } = await adminClient
          .from('credit_transactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'bonus')
          .eq('description', 'Kredit selamat datang')
          .maybeSingle();

        if (!existingBonus) {
          await adminClient.from('credit_transactions').insert({
            id: randomUUID(),
            user_id: user.id,
            type: 'bonus',
            amount: 10,
            balance_after: 10,
            description: 'Kredit selamat datang'
          });
        }

        // Auto-create default workspace
        const firstName = (user.user_metadata?.full_name || 'User').split(' ')[0];
        const workspaceId = randomUUID();

        await adminClient.from('workspaces').insert({
          id: workspaceId,
          user_id: user.id,
          name: `${firstName} Workspace`,
          slug: generateSlug(firstName),
          plan: 'smb',
        });
      }
    }
  }

  const pkg = requestUrl.searchParams.get('package');
  const brand = requestUrl.searchParams.get('brand');
  const next = requestUrl.searchParams.get('next');

  if (pkg) {
    return NextResponse.redirect(`${origin}/dashboard/credits?package=${pkg}`);
  }
  if (brand) {
    return NextResponse.redirect(`${origin}/new-project`);
  }
  if (next && next.startsWith('/')) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // First-time users → create first project; returning users → dashboard
  if (code) {
    const adminClient = createSupabaseAdminClient();
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Get user's workspaces
      const { data: userWorkspaces } = await adminClient
        .from('workspaces')
        .select('id')
        .eq('user_id', user.id);

      const wsIds = (userWorkspaces || []).map(w => w.id);

      if (wsIds.length > 0) {
        const { count } = await adminClient
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .in('workspace_id', wsIds);

        if (count === 0) {
          return NextResponse.redirect(`${origin}/new-project`);
        }
      } else {
        // No workspaces at all — redirect to create first project
        return NextResponse.redirect(`${origin}/new-project`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
