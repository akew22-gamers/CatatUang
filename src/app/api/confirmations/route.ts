import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { user_id, group_id, original_message, parsed_data } = body

    if (!user_id || !group_id || !original_message || !parsed_data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ai_confirmations')
      .insert({
        user_id,
        group_id,
        original_message,
        parsed_data,
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Create confirmation error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
