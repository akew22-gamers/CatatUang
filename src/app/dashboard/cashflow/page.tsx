'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react'
import { IncomeModal } from '@/components/modals/IncomeModal'
import { ExpenseModal } from '@/components/modals/ExpenseModal'
import { TransferModal } from '@/components/modals/TransferModal'

export default function CashflowPage() {
  const [incomeOpen, setIncomeOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)

  const handleSuccess = () => {
    window.location.reload()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Arus Kas</h1>
        <p className="text-gray-500 mt-1">Pilih jenis transaksi yang ingin dicatat</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <button
          onClick={() => setIncomeOpen(true)}
          className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 sm:p-8 text-left transition-all duration-300 hover:shadow-xl hover:shadow-green-100 hover:-translate-y-1 hover:border-green-200"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-green-200">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pemasukan</h3>
            <p className="text-sm text-gray-500">Catat pemasukan ke dompet Anda</p>
          </div>
        </button>

        <button
          onClick={() => setExpenseOpen(true)}
          className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 sm:p-8 text-left transition-all duration-300 hover:shadow-xl hover:shadow-red-100 hover:-translate-y-1 hover:border-red-200"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mb-4 shadow-lg shadow-red-200">
              <TrendingDown className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pengeluaran</h3>
            <p className="text-sm text-gray-500">Catat pengeluaran dari dompet Anda</p>
          </div>
        </button>

        <button
          onClick={() => setTransferOpen(true)}
          className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 sm:p-8 text-left transition-all duration-300 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1 hover:border-blue-200"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
              <ArrowRightLeft className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Transfer</h3>
            <p className="text-sm text-gray-500">Transfer saldo antar dompet</p>
          </div>
        </button>
      </div>

      <IncomeModal
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        onSuccess={handleSuccess}
      />
      <ExpenseModal
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        onSuccess={handleSuccess}
      />
      <TransferModal
        open={transferOpen}
        onOpenChange={setTransferOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}