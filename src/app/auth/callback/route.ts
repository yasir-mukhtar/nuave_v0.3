import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { NextResponse } from 'next/server';

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
      
      // If new user, create record with 10 free credits
      if (!existingUser) {
        // We use adminClient to bypass RLS for initial user setup if needed
        await adminClient.from('users').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          credits_balance: 10
        });
        
        // Log the bonus credit transaction
        await adminClient.from('credit_transactions').insert({
          user_id: user.id,
          type: 'bonus',
          amount: 10,
          balance_after: 10,
          description: 'Welcome bonus - 10 free credits'
        });
      }
    }
  }

  const pkg = requestUrl.searchParams.get('package');
  const brand = requestUrl.searchParams.get('brand');

  if (pkg) {
    return NextResponse.redirect(`${origin}/dashboard/credits?package=${pkg}`);
  }
  if (brand) {
    return NextResponse.redirect(`${origin}/onboarding/analyze`);
  }

  // Default redirect
  return NextResponse.redirect(`${origin}/dashboard`);
}
