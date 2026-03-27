'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function ReportsPage() {
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
            <div className="text-2xl sm:text-3xl font-bold text-green-600">Rp 0</div>
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
            <div className="text-2xl sm:text-3xl font-bold text-red-600">Rp 0</div>
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
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">Rp 0</div>
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
              <CardTitle className="text-lg font-semibold text-gray-900">Grafik Keuangan</CardTitle>
              <p className="text-sm text-gray-500">Visualisasi alur keuangan Anda</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700">
              Grafik akan segera hadir
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              Fitur grafik dan analisis sedang dalam pengembangan
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}