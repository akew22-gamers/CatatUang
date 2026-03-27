'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Wallet, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    totalSaldo: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [transactionsResult, walletsResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('type, amount')
          .eq('group_id', 1)
          .gte('transaction_date', firstDayOfMonth),
        supabase
          .from('wallets')
          .select('saldo')
          .eq('group_id', 1),
      ])

      const transactions = transactionsResult.data || []
      const wallets = walletsResult.data || []

      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

      const totalSaldo = wallets.reduce((sum, w) => sum + (Number(w.saldo) || 0), 0)

      setStats({ totalIncome, totalExpense, totalSaldo })
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
          <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Laporan</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-0.5">
            Analisis dan ringkasan keuangan Anda
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="rounded-2xl border-gray-100 shadow-subtle overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Pemasukan</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  Rp {stats.totalIncome.toLocaleString('id-ID')}
                </div>
                <p className="text-xs text-gray-500 mt-1">Bulan ini</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-100 shadow-subtle overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-red-400 to-rose-500" />
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Pengeluaran</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl sm:text-3xl font-bold text-red-600">
                  Rp {stats.totalExpense.toLocaleString('id-ID')}
                </div>
                <p className="text-xs text-gray-500 mt-1">Bulan ini</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-100 shadow-subtle overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-indigo-400 to-purple-500" />
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Saldo Bersih</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-indigo-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Rp {stats.totalSaldo.toLocaleString('id-ID')}
                </div>
                <p className="text-xs text-gray-500 mt-1">Semua dompet</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-gray-100 shadow-subtle">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Ringkasan Bulan Ini</CardTitle>
                  <p className="text-sm text-gray-500">Perbandingan pemasukan dan pengeluaran</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pemasukan</span>
                    <span className="font-medium text-green-600">Rp {stats.totalIncome.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ 
                        width: stats.totalIncome + stats.totalExpense > 0 
                          ? `${(stats.totalIncome / (stats.totalIncome + stats.totalExpense)) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pengeluaran</span>
                    <span className="font-medium text-red-600">Rp {stats.totalExpense.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-400 to-rose-500 rounded-full transition-all duration-500"
                      style={{ 
                        width: stats.totalIncome + stats.totalExpense > 0 
                          ? `${(stats.totalExpense / (stats.totalIncome + stats.totalExpense)) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Selisih</span>
                    <span className={`text-lg font-bold ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.totalIncome - stats.totalExpense >= 0 ? '+' : ''}Rp {(stats.totalIncome - stats.totalExpense).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}