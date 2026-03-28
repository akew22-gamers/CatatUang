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

    const transactions = parsed_data.transaksi || []
    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transaction data' },
        { status: 400 }
      )
    }

    console.log(`Processing ${transactions.length} transaction(s):`, transactions)

    const savedTransactions: any[] = []
    const errors: string[] = []

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i]
      
      if (!tx.dompet) {
        errors.push(`Transaksi #${i + 1} (${tx.keterangan}): Dompet belum dipilih`)
        continue
      }

      if (!tx.nominal || tx.nominal <= 0) {
        errors.push(`Transaksi #${i + 1} (${tx.keterangan}): Nominal tidak valid`)
        continue
      }

      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('id, saldo, name')
        .eq('name', tx.dompet)
        .eq('group_id', group_id)
        .single()

      if (walletError || !walletData) {
        console.error('Wallet not found:', tx.dompet, walletError)
        errors.push(`Dompet "${tx.dompet}" tidak ditemukan`)
        continue
      }

      if (tx.jenis === 'pengeluaran' && tx.nominal) {
        const currentBalance = Number(walletData.saldo) || 0
        if (tx.nominal > currentBalance) {
          errors.push(`Saldo tidak cukup di ${tx.dompet}! Saldo: Rp ${currentBalance.toLocaleString('id-ID')}`)
          continue
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
        errors.push(`Gagal menyimpan transaksi "${tx.keterangan}": ${txError.message}`)
        continue
      }

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

      const { error: updateError } = await supabase
        .from('wallets')
        .update({ saldo: walletBalance })
        .eq('id', walletData.id)

      if (updateError) {
        console.error('Balance update error:', updateError)
        errors.push(`Gagal update saldo ${tx.dompet}`)
        continue
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

      savedTransactions.push({
        id: transaction?.id,
        jenis: tx.jenis,
        nominal: tx.nominal,
        keterangan: tx.keterangan,
        dompet: tx.dompet,
        new_balance: walletBalance
      })

      console.log(`Transaction ${i + 1} saved:`, tx.keterangan)
    }

    if (savedTransactions.length === 0) {
      return NextResponse.json(
        { error: errors.length > 0 ? errors.join(', ') : 'Gagal menyimpan transaksi' },
        { status: 400 }
      )
    }

    if (errors.length > 0 && savedTransactions.length > 0) {
      return NextResponse.json({ 
        success: true,
        partial: true,
        saved_count: savedTransactions.length,
        total_count: transactions.length,
        saved_transactions: savedTransactions,
        errors: errors,
        message: `${savedTransactions.length} dari ${transactions.length} transaksi berhasil disimpan. Error: ${errors.join(', ')}`
      })
    }

    console.log(`All ${savedTransactions.length} transaction(s) saved successfully!`)

    return NextResponse.json({ 
      success: true,
      saved_count: savedTransactions.length,
      saved_transactions: savedTransactions
    })
  } catch (error: any) {
    console.error('Save transaction error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}