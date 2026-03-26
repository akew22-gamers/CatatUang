'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SettingsPage() {
  const [wallets, setWallets] = useState<any[]>([])
  const [newWallet, setNewWallet] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .order('name')

      setWallets(walletData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addWallet() {
    if (!newWallet.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('wallets')
      .insert({
        name: newWallet.trim(),
        group_id: 1,
        created_by: user.id,
        saldo: 0,
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setNewWallet('')
      loadData()
    }
  }

  async function deleteWallet(id: number) {
    if (!confirm('Hapus dompet ini?')) return

    const { error } = await supabase
      .from('wallets')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Kelola dompet Anda
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>💳 Dompet</CardTitle>
          <CardDescription>Kelola dompet Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nama dompet (e.g., GoPay)"
              value={newWallet}
              onChange={(e) => setNewWallet(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addWallet()}
            />
            <Button onClick={() => addWallet()}>Tambah</Button>
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-2">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-semibold">{wallet.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Saldo: Rp {(wallet.saldo || 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteWallet(wallet.id)}
                  >
                    Hapus
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
