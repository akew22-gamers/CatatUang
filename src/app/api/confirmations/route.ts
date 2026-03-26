import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { user_id, group_id, parsed_data } = body

    if (!user_id || !parsed_data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const tx = parsed_data.transaksi?.[0]
    if (!tx) {
      return NextResponse.json(
        { error: 'No transaction data' },
        { status: 400 }
      )
    }

    console.log('Saving transaction:', {
      type: tx.jenis,
      amount: tx.nominal,
      wallet: tx.dompet,
      description: tx.keterangan,
      user_id,
    })

    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('id, saldo')
      .eq('name', tx.dompet)
      .eq('group_id', group_id)
      .single()

    if (walletError || !walletData) {
      console.error('Wallet not found:', tx.dompet, walletError)
      return NextResponse.json(
        { error: `Dompet "${tx.dompet}" tidak ditemukan` },
        { status: 404 }
      )
    }

    console.log('Current wallet balance:', walletData.saldo)

    if (tx.jenis === 'pengeluaran' && tx.nominal) {
      const currentBalance = Number(walletData.saldo) || 0
      if (tx.nominal > currentBalance) {
        return NextResponse.json(
          { error: `Saldo tidak cukup! Saldo ${tx.dompet}: Rp ${currentBalance.toLocaleString('id-ID')}` },
          { status: 400 }
        )
      }
    }

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        type: tx.jenis === 'pemasukan' ? 'income' : 'expense',
        amount: tx.nominal,
        description: tx.keterangan,
        group_id,
        created_by: user_id,
        wallet_id: walletData.id,
        wallet_name: tx.dompet,
        transaction_date: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (txError) {
      console.error('Transaction insert error:', txError)
      throw txError
    }

    console.log('Transaction inserted, ID:', transaction?.id)

    let walletBalance = Number(walletData.saldo) || 0
    let changeAmount = 0
    let changeType = 'adjustment'

    if (tx.jenis === 'pemasukan' && tx.nominal) {
      walletBalance += tx.nominal
      changeAmount = tx.nominal
      changeType = 'income'
    } else if (tx.jenis === 'pengeluaran' && tx.nominal) {
      walletBalance -= tx.nominal
      changeAmount = -tx.nominal
      changeType = 'expense'
    }

    console.log('New balance:', walletBalance)

    const { error: updateError } = await supabase
      .from('wallets')
      .update({ saldo: walletBalance })
      .eq('id', walletData.id)

    if (updateError) {
      console.error('Balance update error:', updateError)
      throw updateError
    }

    const { error: historyError } = await supabase
      .from('wallet_balance_history')
      .insert({
        wallet_id: walletData.id,
        previous_balance: Number(walletData.saldo) || 0,
        new_balance: walletBalance,
        change_amount: changeAmount,
        change_type: changeType,
        transaction_id: transaction?.id || null,
        created_by: user_id,
        description: `${changeType === 'income' ? 'Pemasukan' : 'Pengeluaran'}: ${tx.keterangan}`,
      })

    if (historyError) {
      console.error('History log error:', historyError)
    }

    console.log('Transaction saved successfully!')

    return NextResponse.json({ 
      success: true,
      transaction_id: transaction?.id,
      new_balance: walletBalance 
    })
  } catch (error: any) {
    console.error('Save transaction error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}