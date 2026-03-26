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
      .select('name')
      .eq('group_id', group_id)
      .order('name')

    const wallets = walletData?.map(w => w.name) || []

    console.log('Database context:', { wallets })

    const result = await parseFinancialChat(message, {
      wallets,
      group_id,
    })

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('Parse transaction API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
