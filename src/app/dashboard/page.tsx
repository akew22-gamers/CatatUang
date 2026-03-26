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

      const { data: wallets } = await supabase
        .from('wallets')
        .select('saldo')

      const totalBalance = wallets?.reduce((sum, w) => sum + (w.saldo || 0), 0) || 0

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Ringkasan keuangan Anda</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Saldo Total</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              Rp {stats.totalBalance.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pemasukan Bulan Ini</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              Rp {stats.totalIncome.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pengeluaran Bulan Ini</CardTitle>
            <span className="text-2xl">📉</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              Rp {stats.totalExpense.toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Transaksi</CardTitle>
            <span className="text-2xl">📋</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.transactionCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">📝 Catat Transaksi</h3>
          <p className="text-gray-600 mb-4">Gunakan Telegram Bot untuk mencatat transaksi dengan cepat</p>
          <a
            href="https://t.me/CatatUangBot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Buka Bot →
          </a>
        </Card>

        <Card className="bg-white shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">💳 Kelola Dompet</h3>
          <p className="text-gray-600 mb-4">Tambah atau edit dompet Anda di settings</p>
          <a
            href="/settings"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Buka Settings →
          </a>
        </Card>
      </div>
    </div>
  )
}
