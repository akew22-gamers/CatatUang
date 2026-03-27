import { NextRequest, NextResponse } from 'next/server'
import { parseFinancialChat } from '@/lib/ai/parser'
import { createClient } from '@/lib/supabase/server'

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
    const { data: walletData } = await supabase
      .from('wallets')
      .select('id, name, saldo')
      .eq('group_id', group_id)
      .order('name')

    const wallets = walletData?.map(w => w.name) || []
    const walletsSaldo = walletData?.map(w => ({ name: w.name, saldo: w.saldo || 0 })) || []

    console.log('Database context:', { wallets, walletsSaldo })

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

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('Parse transaction API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
