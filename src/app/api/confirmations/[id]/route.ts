import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { status } = body

    if (!status || !['confirmed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const { data: confirmation, error: fetchError } = await supabase
      .from('ai_confirmations')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !confirmation) {
      return NextResponse.json(
        { error: 'Confirmation not found' },
        { status: 404 }
      )
    }

    if (status === 'confirmed') {
      const parsed = confirmation.parsed_data as any

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          type: parsed.jenis === 'pemasukan' ? 'income' : 'expense',
          amount: parsed.nominal,
          description: parsed.keterangan,
          wallet_name: parsed.dompet,
          created_by: confirmation.user_id,
          group_id: confirmation.group_id,
          transaction_date: new Date().toISOString(),
        })
        .select()
        .single()

      if (txError) throw txError

      // Delete confirmation
      await supabase
        .from('ai_confirmations')
        .delete()
        .eq('id', params.id)

      return NextResponse.json({ data: transaction, message: 'Transaction created' })
    } else {
      await supabase
        .from('ai_confirmations')
        .delete()
        .eq('id', params.id)

      return NextResponse.json({ message: 'Confirmation rejected' })
    }
  } catch (error: any) {
    console.error('Update confirmation error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
