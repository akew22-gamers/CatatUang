import { NextRequest, NextResponse } from 'next/server'
import { parseFinancialChat } from '@/lib/ai/parser'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, group_id = 1 } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabaseAuth = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    })
    
    const [walletResult, userResult] = await Promise.all([
      supabase
        .from('wallets')
        .select('id, name, saldo')
        .eq('group_id', group_id)
        .order('name'),
      supabaseAuth.auth.getUser()
    ])

    const walletData = walletResult.data
    const user = userResult.data?.user

    const wallets = walletData?.map(w => w.name) || []
    const walletsSaldo = walletData?.map(w => ({ name: w.name, saldo: w.saldo || 0 })) || []

    console.log('Database context:', { wallets, walletsSaldo, userId: user?.id })

    const result = await parseFinancialChat(message, {
      wallets,
      walletsSaldo,
      group_id,
    })

    if (result.status === 'cek_saldo') {
      const totalSaldo = walletsSaldo.reduce((sum, w) => sum + w.saldo, 0)
      return NextResponse.json({ 
        data: {
          ...result,
          saldo_info: walletsSaldo,
          total_saldo: totalSaldo
        }
      })
    }

    if (result.status === 'cek_profile') {
      let profileData = null
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        const { count: transactionCount } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group_id)
        
        const totalSaldo = walletsSaldo.reduce((sum, w) => sum + w.saldo, 0)
        
        profileData = {
          id: user.id,
          email: user.email,
          full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
          created_at: profile?.created_at || user.created_at,
          role: profile?.role || 'user',
          total_wallets: wallets.length,
          total_saldo: totalSaldo,
          total_transactions: transactionCount || 0,
        }
      }
      
      return NextResponse.json({ 
        data: {
          ...result,
          profile_info: profileData
        }
      })
    }

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('Parse transaction API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
