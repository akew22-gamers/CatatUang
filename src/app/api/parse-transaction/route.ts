import { NextRequest, NextResponse } from 'next/server'
import { parseTransaction } from '@/lib/ai/parser'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, group_id } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    let categories: string[] = []
    let wallets: string[] = []

    if (group_id) {
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

      categories = catData?.map(c => c.name) || []
      wallets = walletData?.map(w => w.name) || []
    }

    console.log('Database context:', { categories, wallets })

    const result = await parseTransaction(message, { categories, wallets })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: result.data })
  } catch (error: any) {
    console.error('Parse transaction API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
