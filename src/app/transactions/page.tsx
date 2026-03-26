'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Transaction {
  id: number
  type: string
  amount: number
  description: string
  wallet_name: string | null
  category_name: string | null
  transaction_date: string
}

export default function TransactionsPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const supabase = createClient()

  useEffect(() => {
    loadTransactions()
  }, [filter])

  async function loadTransactions() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('telegram_user_id', user.id)
        .order('transaction_date', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('type', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transaksi</h1>
        <p className="text-muted-foreground">
          Riwayat semua transaksi Anda
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Semua
            </Button>
            <Button
              variant={filter === 'income' ? 'default' : 'outline'}
              onClick={() => setFilter('income')}
            >
              Pemasukan
            </Button>
            <Button
              variant={filter === 'expense' ? 'default' : 'outline'}
              onClick={() => setFilter('expense')}
            >
              Pengeluaran
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Belum ada transaksi
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{tx.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {tx.wallet_name && `${tx.wallet_name} • `}
                      {tx.category_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(tx.transaction_date)}
                    </div>
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    Rp {tx.amount.toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
