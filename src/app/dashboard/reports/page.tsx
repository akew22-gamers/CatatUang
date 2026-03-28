'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  BarChart3, Wallet, ArrowUpRight, ArrowDownRight, Loader2, 
  FileText, Download, Calendar, ChevronDown 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  generateSummaryPDF,
  generateSummaryXLSX,
  generateActivityPDF,
  generateActivityXLSX,
  SummaryReportData,
  ActivityReportData,
  ActivityReportRow
} from '@/lib/export/reports'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatNumber(amount: number): string {
  return amount.toLocaleString('id-ID')
}

function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

interface TransactionWithUser {
  id: number
  type: string
  amount: number
  description: string
  transaction_date: string
  wallet_name: string | null
  created_by: string | null
  user_name: string | null
}

interface Wallet {
  id: number
  name: string
  saldo: number
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    totalSaldo: 0,
    selisih: 0
  })
  const [transactions, setTransactions] = useState<TransactionWithUser[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null)
  
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0])
  
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [startDate, endDate, selectedWalletId])

  async function loadData() {
    try {
      setLoading(true)
      
      const [transactionsResult, walletsResult, profilesResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('id, type, amount, description, transaction_date, wallet_name, wallet_id, created_by')
          .eq('group_id', 1)
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .order('transaction_date', { ascending: true }),
        supabase
          .from('wallets')
          .select('id, name, saldo')
          .eq('group_id', 1),
        supabase
          .from('profiles')
          .select('id, full_name')
      ])

      const profiles = profilesResult.data || []
      const profileMap = new Map(profiles.map(p => [p.id, p.full_name]))

      let filteredTransactions = transactionsResult.data || []
      if (selectedWalletId) {
        filteredTransactions = filteredTransactions.filter(t => t.wallet_id === selectedWalletId)
      }

      const transactionsWithUser: TransactionWithUser[] = filteredTransactions.map(t => ({
        ...t,
        user_name: t.created_by ? profileMap.get(t.created_by) || null : null
      }))

      setTransactions(transactionsWithUser)
      setWallets(walletsResult.data || [])

      const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

      const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

      const totalSaldo = selectedWalletId
        ? (walletsResult.data?.find(w => w.id === selectedWalletId)?.saldo || 0)
        : (walletsResult.data || []).reduce((sum, w) => sum + (Number(w.saldo) || 0), 0)

      setStats({
        totalIncome,
        totalExpense,
        totalSaldo,
        selisih: totalIncome - totalExpense
      })
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  function prepareActivityData(): ActivityReportData {
    const initialBalance = stats.totalSaldo - stats.selisih
    let runningBalance = initialBalance
    
    const rows: ActivityReportRow[] = transactions.map((t, index) => {
      if (t.type === 'income') {
        runningBalance += t.amount
      } else if (t.type === 'expense') {
        runningBalance -= t.amount
      }
      
      return {
        no: index + 1,
        tanggal: formatDateDisplay(t.transaction_date),
        user: t.user_name || '-',
        keterangan: t.description,
        pemasukan: t.type === 'income' ? formatNumber(t.amount) : '',
        pengeluaran: t.type === 'expense' ? formatNumber(t.amount) : '',
        saldo: formatNumber(runningBalance)
      }
    })

    const walletName = selectedWalletId 
      ? wallets.find(w => w.id === selectedWalletId)?.name 
      : undefined

    return {
      rows,
      startDate,
      endDate,
      walletName,
      initialBalance,
      finalBalance: runningBalance
    }
  }

  async function handleExportSummaryPDF() {
    setExporting(true)
    try {
      const walletName = selectedWalletId 
        ? wallets.find(w => w.id === selectedWalletId)?.name 
        : undefined
      
      const data: SummaryReportData = {
        totalIncome: stats.totalIncome,
        totalExpense: stats.totalExpense,
        totalSaldo: stats.totalSaldo,
        selisih: stats.selisih,
        startDate,
        endDate,
        walletName
      }
      
      generateSummaryPDF(data)
    } finally {
      setExporting(false)
    }
  }

  async function handleExportSummaryXLSX() {
    setExporting(true)
    try {
      const walletName = selectedWalletId 
        ? wallets.find(w => w.id === selectedWalletId)?.name 
        : undefined
      
      const data: SummaryReportData = {
        totalIncome: stats.totalIncome,
        totalExpense: stats.totalExpense,
        totalSaldo: stats.totalSaldo,
        selisih: stats.selisih,
        startDate,
        endDate,
        walletName
      }
      
      generateSummaryXLSX(data)
    } finally {
      setExporting(false)
    }
  }

  async function handleExportActivityPDF() {
    setExporting(true)
    try {
      const data = prepareActivityData()
      generateActivityPDF(data)
    } finally {
      setExporting(false)
    }
  }

  async function handleExportActivityXLSX() {
    setExporting(true)
    try {
      const data = prepareActivityData()
      generateActivityXLSX(data)
    } finally {
      setExporting(false)
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

      <Card className="rounded-2xl border-gray-100 shadow-subtle">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Filter Periode</CardTitle>
              <p className="text-sm text-gray-500">Pilih tanggal untuk laporan</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Tanggal Mulai</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Tanggal Akhir</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Dompet</label>
              <select
                value={selectedWalletId || ''}
                onChange={(e) => setSelectedWalletId(e.target.value ? Number(e.target.value) : null)}
                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500/20"
              >
                <option value="">Semua Dompet</option>
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  {formatCurrency(stats.totalIncome)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
                </p>
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
                  {formatCurrency(stats.totalExpense)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
                </p>
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
                  {formatCurrency(stats.totalSaldo)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedWalletId ? wallets.find(w => w.id === selectedWalletId)?.name : 'Semua dompet'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-gray-100 shadow-subtle">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Ringkasan Periode</CardTitle>
                    <p className="text-sm text-gray-500">Perbandingan pemasukan dan pengeluaran</p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={exporting}
                      className="h-10 rounded-xl border-gray-200 hover:bg-gray-50"
                    >
                      {exporting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Export
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                      Laporan Ringkasan
                    </div>
                    <DropdownMenuItem onClick={handleExportSummaryPDF}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportSummaryXLSX}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export Excel (XLSX)
                    </DropdownMenuItem>
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t mt-1">
                      Laporan Aktivitas
                    </div>
                    <DropdownMenuItem onClick={handleExportActivityPDF}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportActivityXLSX}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export Excel (XLSX)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pemasukan</span>
                    <span className="font-medium text-green-600">{formatCurrency(stats.totalIncome)}</span>
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
                    <span className="font-medium text-red-600">{formatCurrency(stats.totalExpense)}</span>
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
                    <span className={`text-lg font-bold ${stats.selisih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.selisih >= 0 ? '+' : ''}{formatCurrency(stats.selisih)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {transactions.length > 0 && (
            <Card className="rounded-2xl border-gray-100 shadow-subtle">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Aktivitas Transaksi</CardTitle>
                    <p className="text-sm text-gray-500">{transactions.length} transaksi dalam periode ini</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">No</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">Tanggal</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">User</th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">Keterangan</th>
                        <th className="text-right py-2 px-2 font-semibold text-gray-600">Masuk</th>
                        <th className="text-right py-2 px-2 font-semibold text-gray-600">Keluar</th>
                        <th className="text-right py-2 px-2 font-semibold text-gray-600">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const initialBalance = stats.totalSaldo - stats.selisih
                        let runningBalance = initialBalance
                        return transactions.slice(0, 10).map((t, index) => {
                          if (t.type === 'income') runningBalance += t.amount
                          else if (t.type === 'expense') runningBalance -= t.amount
                          
                          return (
                            <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="py-2 px-2 text-gray-500">{index + 1}</td>
                              <td className="py-2 px-2">{formatDateDisplay(t.transaction_date)}</td>
                              <td className="py-2 px-2 text-gray-600">{t.user_name || '-'}</td>
                              <td className="py-2 px-2 text-gray-600 max-w-[200px] truncate">{t.description}</td>
                              <td className="py-2 px-2 text-right text-green-600">
                                {t.type === 'income' ? formatNumber(t.amount) : '-'}
                              </td>
                              <td className="py-2 px-2 text-right text-red-600">
                                {t.type === 'expense' ? formatNumber(t.amount) : '-'}
                              </td>
                              <td className="py-2 px-2 text-right font-medium">
                                {formatNumber(runningBalance)}
                              </td>
                            </tr>
                          )
                        })
                      })()}
                    </tbody>
                  </table>
                </div>
                {transactions.length > 10 && (
                  <p className="text-sm text-gray-500 mt-3 text-center">
                    Menampilkan 10 dari {transactions.length} transaksi. 
                    Export untuk melihat semua data.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}