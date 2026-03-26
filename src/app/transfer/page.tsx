'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRightLeft, ArrowRight } from 'lucide-react'

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transfer</h1>
        <p className="text-muted-foreground mt-1">
          Pindahkan saldo antar dompet
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Form Transfer</CardTitle>
              <CardDescription>Transfer saldo antar dompet</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dariDompet">Dari Dompet</Label>
              <Select value={formData.dariDompet} onValueChange={(v) => setFormData({ ...formData, dariDompet: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dompet asal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💳 Cash</SelectItem>
                  <SelectItem value="bca">💳 BCA</SelectItem>
                  <SelectItem value="gopay">💳 GoPay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keDompet">Ke Dompet</Label>
              <Select value={formData.keDompet} onValueChange={(v) => setFormData({ ...formData, keDompet: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dompet tujuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💳 Cash</SelectItem>
                  <SelectItem value="bca">💳 BCA</SelectItem>
                  <SelectItem value="gopay">💳 GoPay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nominal">Nominal</Label>
              <Input
                id="nominal"
                type="number"
                placeholder="Contoh: 100000"
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
              <Input
                id="keterangan"
                placeholder="Contoh: Tarik tunai"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              {loading ? 'Memproses...' : 'Transfer'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}