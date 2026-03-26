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
    const [{ data: catData }, { data: walletData }] = await Promise.all([
      supabase
        .from('categories')
        .select('name')
        .eq('group_id', group_id)
        .order('name'),
      supabase
        .from('wallets')
        .select('name')
        .eq('group_id', group_id)
        .order('name'),
    ])

    const categories = catData?.map(c => c.name) || []
    const wallets = walletData?.map(w => w.name) || []

    console.log('Database context:', { categories, wallets })

    const result = await parseFinancialChat(message, {
      categories,
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
