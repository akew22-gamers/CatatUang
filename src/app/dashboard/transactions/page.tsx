'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Wallet, Calendar, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react'

interface Transaction {
  id: number
  type: string
  amount: number
  description: string
  wallet_name: string | null
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
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('group_id', 1)
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
    })
  }

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filterButtons = [
    { key: 'all' as const, label: 'Semua', icon: Filter },
    { key: 'income' as const, label: 'Pemasukan', icon: ArrowDownLeft },
    { key: 'expense' as const, label: 'Pengeluaran', icon: ArrowUpRight },
  ]

  const getTransactionIcon = (type: string) => {
    if (type === 'income') {
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </div>
      )
    }
    return (
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-rose-100 to-red-100 flex items-center justify-center flex-shrink-0">
        <TrendingDown className="h-5 w-5 text-rose-600" />
      </div>
    )
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Riwayat Transaksi</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Kelola dan pantau semua transaksi Anda
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card className="border-0 shadow-subtle bg-gradient-to-br from-emerald-50 to-green-50/50 rounded-2xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-emerald-700">Total Pemasukan</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                Rp {totalIncome.toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-subtle bg-gradient-to-br from-rose-50 to-red-50/50 rounded-2xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-rose-700">Total Pengeluaran</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                Rp {totalExpense.toLocaleString('id-ID')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-subtle bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 pt-4 sm:pt-6 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Filter Transaksi</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {filterButtons.map((btn) => {
                const Icon = btn.icon
                const isActive = filter === btn.key
                return (
                  <Button
                    key={btn.key}
                    variant="outline"
                    size="sm"
                    onClick={() => setFilter(btn.key)}
                    className={`flex-shrink-0 rounded-full px-4 sm:px-5 h-9 sm:h-10 text-xs sm:text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    {btn.label}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-subtle bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 pt-4 sm:pt-6 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
              Daftar Transaksi
              <span className="ml-2 text-xs sm:text-sm font-normal text-gray-400">
                ({transactions.length} transaksi)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-gray-50 animate-pulse">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Belum ada transaksi
                </h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  Mulai catat transaksi pertama Anda melalui dashboard chat
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors duration-200 group"
                  >
                    {getTransactionIcon(tx.type)}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {tx.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs sm:text-sm text-gray-500">
                        {tx.wallet_name && (
                          <span className="flex items-center gap-1">
                            <Wallet className="h-3 w-3" />
                            {tx.wallet_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(tx.transaction_date)}
                        </span>
                        <span className="text-gray-400">
                          {formatTime(tx.transaction_date)}
                        </span>
                      </div>
                    </div>
                    
                    <div
                      className={`text-right flex-shrink-0 ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      <p className="font-bold text-sm sm:text-lg">
                        {tx.type === 'income' ? '+' : '-'}
                        Rp {tx.amount.toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400 capitalize">
                        {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
