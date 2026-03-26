'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    transactionCount: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get wallet balances
      const { data: wallets } = await supabase
        .from('wallets')
        .select('saldo')

      const totalBalance = wallets?.reduce((sum, w) => sum + (w.saldo || 0), 0) || 0

      // Get transaction stats
      const { data: transactions } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('telegram_user_id', user.id)

      const totalIncome = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0

      const totalExpense = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0

      setStats({
        totalBalance,
        totalIncome,
        totalExpense,
        transactionCount: transactions?.length || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan keuangan Anda
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Total
            </CardTitle>
            <span>💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {stats.totalBalance.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pemasukan
            </CardTitle>
            <span>📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp {stats.totalIncome.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pengeluaran
            </CardTitle>
            <span>📉</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              Rp {stats.totalExpense.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transaksi
            </CardTitle>
            <span>📋</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.transactionCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">📝 Catat Transaksi</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Gunakan Telegram Bot untuk mencatat transaksi dengan cepat
              </p>
              <a
                href="https://t.me/CatatUangBot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Buka Bot →
              </a>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">💳 Kelola Dompet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tambah atau edit dompet Anda di settings
              </p>
              <a
                href="/dashboard/settings"
                className="text-sm text-primary hover:underline"
              >
                Buka Settings →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
