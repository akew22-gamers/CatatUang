'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, PlusCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Wallet {
  id: number
  name: string
  saldo: number
}

export default function IncomePage() {
  const [loading, setLoading] = useState(false)
  const [loadingWallets, setLoadingWallets] = useState(true)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [formData, setFormData] = useState({
    nominal: '',
    dompet: '',
    keterangan: '',
  })
  const supabase = createClient()

  useEffect(() => {
    loadWallets()
  }, [])

  const loadWallets = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('id, name, saldo')
        .eq('group_id', 1)
        .order('name')

      if (error) {
        console.error('Error loading wallets:', error)
        toast.error('Gagal memuat data dompet')
      } else {
        setWallets(data || [])
      }
    } catch (error) {
      console.error('Failed to load wallets:', error)
      toast.error('Gagal memuat data dompet')
    } finally {
      setLoadingWallets(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nominal || !formData.dompet) {
      toast.error('Mohon isi nominal dan pilih dompet')
      return
    }

    const nominal = parseFloat(formData.nominal)
    if (isNaN(nominal) || nominal <= 0) {
      toast.error('Nominal harus berupa angka positif')
      return
    }

    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Anda harus login terlebih dahulu')
        return
      }

      const selectedWallet = wallets.find(w => w.id === parseInt(formData.dompet))
      if (!selectedWallet) {
        toast.error('Dompet tidak ditemukan')
        return
      }

      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          group_id: 1,
          created_by: user.id,
          type: 'income',
          amount: nominal,
          description: formData.keterangan || 'Pemasukan manual',
          wallet_id: selectedWallet.id,
          wallet_name: selectedWallet.name,
          transaction_date: new Date().toISOString(),
        })

      if (txError) throw txError

      const currentSaldo = Number(selectedWallet.saldo) || 0
      const newSaldo = currentSaldo + nominal
      
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ saldo: newSaldo })
        .eq('id', selectedWallet.id)

      if (walletError) {
        throw new Error('Gagal update saldo dompet: ' + walletError.message)
      }

      toast.success('Pemasukan berhasil disimpan!')
      setFormData({ nominal: '', dompet: '', keterangan: '' })
      loadWallets()
    } catch (error: any) {
      console.error('Error saving income:', error)
      toast.error('Gagal menyimpan pemasukan: ' + error.message)
    } finally {
      setLoading(false)
    }
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
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dompet" className="text-sm font-medium text-gray-700">Dompet Tujuan</Label>
              <Select 
                value={formData.dompet} 
                onValueChange={(v) => setFormData({ ...formData, dompet: v })}
                disabled={loading || loadingWallets}
              >
                <SelectTrigger className="h-11 sm:h-12 rounded-xl border-gray-200">
                  <SelectValue placeholder={loadingWallets ? "Memuat dompet..." : "Pilih dompet"} />
                </SelectTrigger>
                <SelectContent>
                  {wallets.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      Belum ada dompet
                    </SelectItem>
                  ) : (
                    wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id.toString()}>
                        {wallet.name} (Rp {wallet.saldo.toLocaleString('id-ID')})
                      </SelectItem>
                    ))
                  )}
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
                disabled={loading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-lg shadow-green-200 transition-all duration-200" 
              disabled={loading || loadingWallets}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <PlusCircle className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Menyimpan...' : 'Simpan Pemasukan'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}