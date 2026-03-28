'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRightLeft, ArrowDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface Wallet {
  id: number
  name: string
  saldo: number
}

interface TransferModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function TransferModal({ open, onOpenChange, onSuccess }: TransferModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingWallets, setLoadingWallets] = useState(true)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [formData, setFormData] = useState({
    nominal: '',
    dariDompet: '',
    keDompet: '',
    keterangan: '',
  })
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      loadWallets()
    }
  }, [open])

  const loadWallets = async () => {
    try {
      setLoadingWallets(true)
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
    
    if (!formData.nominal || !formData.dariDompet || !formData.keDompet) {
      toast.error('Mohon isi semua field yang diperlukan')
      return
    }

    if (formData.dariDompet === formData.keDompet) {
      toast.error('Dompet asal dan tujuan tidak boleh sama')
      return
    }

    const nominal = parseFloat(formData.nominal)
    if (isNaN(nominal) || nominal <= 0) {
      toast.error('Nominal harus berupa angka positif')
      return
    }

    const fromWallet = wallets.find(w => w.id === parseInt(formData.dariDompet))
    const toWallet = wallets.find(w => w.id === parseInt(formData.keDompet))

    if (!fromWallet || !toWallet) {
      toast.error('Dompet tidak ditemukan')
      return
    }

    const fromSaldoCheck = Number(fromWallet.saldo) || 0
    if (fromSaldoCheck < nominal) {
      toast.error(`Saldo ${fromWallet.name} tidak mencukupi (Rp ${fromSaldoCheck.toLocaleString('id-ID')})`)
      return
    }

    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Anda harus login terlebih dahulu')
        return
      }

      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          group_id: 1,
          created_by: user.id,
          type: 'transfer',
          amount: nominal,
          description: formData.keterangan || `Transfer dari ${fromWallet.name} ke ${toWallet.name}`,
          wallet_id: fromWallet.id,
          wallet_name: fromWallet.name,
          from_wallet_id: fromWallet.id,
          to_wallet_id: toWallet.id,
          transaction_date: new Date().toISOString(),
        })

      if (txError) throw txError

      const fromSaldo = Number(fromWallet.saldo) || 0
      const toSaldo = Number(toWallet.saldo) || 0

      const { error: fromError } = await supabase
        .from('wallets')
        .update({ saldo: fromSaldo - nominal })
        .eq('id', fromWallet.id)

      if (fromError) {
        throw new Error('Gagal update saldo dompet asal: ' + fromError.message)
      }

      const { error: toError } = await supabase
        .from('wallets')
        .update({ saldo: toSaldo + nominal })
        .eq('id', toWallet.id)

      if (toError) {
        throw new Error('Gagal update saldo dompet tujuan: ' + toError.message)
      }

      toast.success('Transfer berhasil!')
      setFormData({ nominal: '', dariDompet: '', keDompet: '', keterangan: '' })
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('Error processing transfer:', error)
      toast.error('Gagal memproses transfer: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const availableToWallets = wallets.filter(w => w.id.toString() !== formData.dariDompet)
  const selectedFromWallet = wallets.find(w => w.id === parseInt(formData.dariDompet))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <ArrowRightLeft className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Transfer</DialogTitle>
              <DialogDescription>Transfer saldo antar dompet</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="transfer-dari" className="text-sm font-medium text-gray-700">Dari Dompet</Label>
            <Select 
              value={formData.dariDompet} 
              onValueChange={(v) => setFormData({ ...formData, dariDompet: v, keDompet: formData.keDompet === v ? '' : formData.keDompet })}
              disabled={loading || loadingWallets}
            >
              <SelectTrigger className="h-11 rounded-xl border-gray-200">
                <SelectValue placeholder={loadingWallets ? "Memuat dompet..." : "Pilih dompet asal"} />
              </SelectTrigger>
              <SelectContent>
                {wallets.length === 0 ? (
                  <SelectItem value="_empty" disabled>Belum ada dompet</SelectItem>
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

          <div className="flex justify-center py-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <ArrowDown className="h-4 w-4 text-blue-600" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-ke" className="text-sm font-medium text-gray-700">Ke Dompet</Label>
            <Select 
              value={formData.keDompet} 
              onValueChange={(v) => setFormData({ ...formData, keDompet: v })}
              disabled={loading || loadingWallets || !formData.dariDompet}
            >
              <SelectTrigger className="h-11 rounded-xl border-gray-200">
                <SelectValue placeholder={!formData.dariDompet ? "Pilih dompet asal dulu" : "Pilih dompet tujuan"} />
              </SelectTrigger>
              <SelectContent>
                {availableToWallets.length === 0 ? (
                  <SelectItem value="_empty" disabled>Tidak ada dompet lain</SelectItem>
                ) : (
                  availableToWallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id.toString()}>
                      {wallet.name} (Rp {wallet.saldo.toLocaleString('id-ID')})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-nominal" className="text-sm font-medium text-gray-700">Nominal</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
              <Input
                id="transfer-nominal"
                type="number"
                placeholder="100.000"
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                className="h-11 pl-12 rounded-xl border-gray-200"
                disabled={loading}
              />
            </div>
            {selectedFromWallet && formData.nominal && (
              <p className="text-xs text-gray-500">
                Saldo tersedia: Rp {selectedFromWallet.saldo.toLocaleString('id-ID')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-keterangan" className="text-sm font-medium text-gray-700">
              Keterangan <span className="text-gray-400 font-normal">(opsional)</span>
            </Label>
            <Input
              id="transfer-keterangan"
              placeholder="Contoh: Tarik tunai"
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="h-11 rounded-xl border-gray-200"
              disabled={loading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-200 transition-all duration-200" 
            disabled={loading || loadingWallets}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <ArrowRightLeft className="h-5 w-5 mr-2" />
            )}
            {loading ? 'Memproses...' : 'Transfer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}