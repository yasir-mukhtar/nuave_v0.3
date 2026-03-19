import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('Auth getUser error:', userError)
    }

    if (!user) {
      console.log('Credits API: No user session found')
      return NextResponse.json({ credits: null })
    }

    console.log('Credits API: Fetching for user', user.id)

    const { data, error } = await supabase
      .from('users')
      .select('credits_balance')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Database error fetching credits:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Credits API result:', { userId: user.id, credits: data?.credits_balance })
    return NextResponse.json({ credits: data?.credits_balance ?? null })
  } catch (err: any) {
    console.error('Credits API error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
