'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, PlusCircle, Wallet } from 'lucide-react'

export default function IncomePage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nominal: '',
    dompet: '',
    keterangan: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    console.log('Income form submitted:', formData)
    
    setTimeout(() => {
      setLoading(false)
      alert('Fitur ini akan segera hadir!')
    }, 1000)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200 flex-shrink-0">
          <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pemasukan</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-0.5">
            Catat pemasukan baru secara manual
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-subtle">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Form Pemasukan</CardTitle>
          <CardDescription>Tambah pemasukan ke dompet Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nominal" className="text-sm font-medium text-gray-700">Nominal</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                <Input
                  id="nominal"
                  type="number"
                  placeholder="500.000"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                  className="h-11 sm:h-12 pl-12 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dompet" className="text-sm font-medium text-gray-700">Dompet Tujuan</Label>
              <Select value={formData.dompet} onValueChange={(v) => setFormData({ ...formData, dompet: v })}>
                <SelectTrigger className="h-11 sm:h-12 rounded-xl border-gray-200">
                  <SelectValue placeholder="Pilih dompet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bca">BCA</SelectItem>
                  <SelectItem value="gopay">GoPay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan" className="text-sm font-medium text-gray-700">Keterangan</Label>
              <Input
                id="keterangan"
                placeholder="Contoh: Gaji bulanan"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                className="h-11 sm:h-12 rounded-xl border-gray-200"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-lg shadow-green-200 transition-all duration-200" 
              disabled={loading}
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan Pemasukan'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}