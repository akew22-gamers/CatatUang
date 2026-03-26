'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingDown, MinusCircle } from 'lucide-react'

export default function ExpensePage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nominal: '',
    dompet: '',
    keterangan: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    console.log('Expense form submitted:', formData)
    
    setTimeout(() => {
      setLoading(false)
      alert('Fitur ini akan segera hadir!')
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengeluaran</h1>
        <p className="text-muted-foreground mt-1">
          Catat pengeluaran baru secara manual
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <CardTitle>Form Pengeluaran</CardTitle>
              <CardDescription>Catat pengeluaran dari dompet Anda</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nominal">Nominal</Label>
              <Input
                id="nominal"
                type="number"
                placeholder="Contoh: 25000"
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dompet">Dari Dompet</Label>
              <Select value={formData.dompet} onValueChange={(v) => setFormData({ ...formData, dompet: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dompet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💳 Cash</SelectItem>
                  <SelectItem value="bca">💳 BCA</SelectItem>
                  <SelectItem value="gopay">💳 GoPay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Input
                id="keterangan"
                placeholder="Contoh: Beli makan siang"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
              <MinusCircle className="h-4 w-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}