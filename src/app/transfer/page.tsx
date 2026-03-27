'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRightLeft, ArrowDown, Wallet } from 'lucide-react'

export default function TransferPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nominal: '',
    dariDompet: '',
    keDompet: '',
    keterangan: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    console.log('Transfer form submitted:', formData)
    
    setTimeout(() => {
      setLoading(false)
      alert('Fitur ini akan segera hadir!')
    }, 1000)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
          <ArrowRightLeft className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transfer</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-0.5">
            Pindahkan saldo antar dompet
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border-gray-100 shadow-subtle">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Form Transfer</CardTitle>
          <CardDescription>Transfer saldo antar dompet</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="dariDompet" className="text-sm font-medium text-gray-700">Dari Dompet</Label>
              <Select value={formData.dariDompet} onValueChange={(v) => setFormData({ ...formData, dariDompet: v })}>
                <SelectTrigger className="h-11 sm:h-12 rounded-xl border-gray-200">
                  <SelectValue placeholder="Pilih dompet asal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bca">BCA</SelectItem>
                  <SelectItem value="gopay">GoPay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center py-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <ArrowDown className="h-5 w-5 text-blue-600" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keDompet" className="text-sm font-medium text-gray-700">Ke Dompet</Label>
              <Select value={formData.keDompet} onValueChange={(v) => setFormData({ ...formData, keDompet: v })}>
                <SelectTrigger className="h-11 sm:h-12 rounded-xl border-gray-200">
                  <SelectValue placeholder="Pilih dompet tujuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bca">BCA</SelectItem>
                  <SelectItem value="gopay">GoPay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nominal" className="text-sm font-medium text-gray-700">Nominal</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                <Input
                  id="nominal"
                  type="number"
                  placeholder="100.000"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                  className="h-11 sm:h-12 pl-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan" className="text-sm font-medium text-gray-700">Keterangan <span className="text-gray-400 font-normal">(opsional)</span></Label>
              <Input
                id="keterangan"
                placeholder="Contoh: Tarik tunai"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                className="h-11 sm:h-12 rounded-xl border-gray-200"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-200 transition-all duration-200" 
              disabled={loading}
            >
              <ArrowRightLeft className="h-5 w-5 mr-2" />
              {loading ? 'Memproses...' : 'Transfer'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}