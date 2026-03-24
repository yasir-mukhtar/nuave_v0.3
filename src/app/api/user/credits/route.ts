import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Auth getUser error:', userError);
    }

    if (!user) {
      return NextResponse.json({ credits: null });
    }

    // v3: credits live on organizations, not users
    // Join: organization_members → organizations.credits_balance
    const { data, error } = await supabase
      .from('organization_members')
      .select('organizations(credits_balance)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Database error fetching credits:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const org = data?.organizations as unknown as { credits_balance: number } | null;
    return NextResponse.json({ credits: org?.credits_balance ?? null });

  } catch (err: any) {
    console.error('Credits API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
