'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, Wallet, Plus, Trash2, CreditCard, Loader2, AlertTriangle, Users, Mail, CheckCircle, XCircle, Crown } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/use-confirm'
import { Badge } from '@/components/ui/badge'

interface AllowedEmail {
  id: string
  email: string
  full_name: string | null
  role: string | null
  is_registered: boolean | null
  registered_at: string | null
  created_at: string | null
}

export default function SettingsPage() {
  const [wallets, setWallets] = useState<any[]>([])
  const [allowedEmails, setAllowedEmails] = useState<AllowedEmail[]>([])
  const [newWallet, setNewWallet] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [addingEmail, setAddingEmail] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')
  const { confirm, ConfirmDialog } = useConfirm()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setUserRole(profile.role as 'admin' | 'user')
      }

      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .order('name')

      setWallets(walletData || [])

      if (profile?.role === 'admin') {
        const { data: emailsData } = await supabase
          .from('allowed_emails')
          .select('*')
          .order('created_at', { ascending: false })

        setAllowedEmails(emailsData || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addWallet() {
    if (!newWallet.trim() || adding) return

    setAdding(true)
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
      toast.error('Gagal menambah dompet: ' + error.message)
    } else {
      toast.success('Dompet berhasil ditambahkan')
      setNewWallet('')
      loadData()
    }
    setAdding(false)
  }

  async function deleteWallet(id: number, name: string) {
    setDeleting(id)
    
    try {
      const { data: transactions, error: checkError } = await supabase
        .from('transactions')
        .select('id')
        .eq('wallet_id', id)
        .limit(1)

      if (checkError) {
        toast.error('Gagal memeriksa transaksi: ' + checkError.message)
        setDeleting(null)
        return
      }

      if (transactions && transactions.length > 0) {
        toast.error(`Dompet "${name}" tidak dapat dihapus karena sudah terintegrasi dengan beberapa transaksi.`, {
          duration: 5000,
          icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        })
        setDeleting(null)
        return
      }

      const confirmed = await confirm({
        title: "Hapus Dompet",
        description: `Apakah Anda yakin ingin menghapus dompet "${name}"?`,
        confirmText: "Hapus",
        cancelText: "Batal"
      })
      
      if (!confirmed) {
        setDeleting(null)
        return
      }

      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error('Gagal menghapus dompet: ' + error.message)
      } else {
        toast.success('Dompet berhasil dihapus')
        loadData()
      }
    } catch (error: any) {
      toast.error('Terjadi kesalahan: ' + error.message)
    } finally {
      setDeleting(null)
    }
  }

  async function addAllowedEmail() {
    if (!newEmail.trim() || addingEmail) return

    setAddingEmail(true)

    const { error } = await supabase
      .from('allowed_emails')
      .insert({
        email: newEmail.trim().toLowerCase(),
        full_name: newName.trim() || null,
        role: newRole,
      })

    if (error) {
      if (error.code === '23505') {
        toast.error('Email sudah ada dalam daftar')
      } else {
        toast.error('Gagal menambah email: ' + error.message)
      }
    } else {
      toast.success('Email berhasil ditambahkan')
      setNewEmail('')
      setNewName('')
      setNewRole('user')
      loadData()
    }
    setAddingEmail(false)
  }

  async function deleteAllowedEmail(id: string, email: string) {
    const confirmed = await confirm({
      title: "Hapus Email",
      description: `Apakah Anda yakin ingin menghapus "${email}" dari daftar yang diizinkan?`,
      confirmText: "Hapus",
      cancelText: "Batal"
    })
    
    if (!confirmed) return

    setDeletingEmail(id)

    const { error } = await supabase
      .from('allowed_emails')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Gagal menghapus email: ' + error.message)
    } else {
      toast.success('Email berhasil dihapus')
      loadData()
    }
    setDeletingEmail(null)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-lg shadow-gray-300 flex-shrink-0">
          <Settings className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-0.5">
            Kelola dompet dan preferensi Anda
          </p>
        </div>
      </div>

      {userRole === 'admin' && (
        <Card className="rounded-2xl border-gray-100 shadow-subtle">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Akses User</CardTitle>
                <CardDescription>Kelola email yang diizinkan untuk mendaftar</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  placeholder="Email (e.g., user@gmail.com)"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="h-11 sm:h-12 rounded-xl border-gray-200 flex-1"
                  disabled={addingEmail}
                />
                <Input
                  placeholder="Nama (opsional)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-11 sm:h-12 rounded-xl border-gray-200 sm:w-40"
                  disabled={addingEmail}
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                  className="h-11 sm:h-12 rounded-xl border border-gray-200 px-3 bg-white text-sm"
                  disabled={addingEmail}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button 
                onClick={() => addAllowedEmail()} 
                disabled={addingEmail || !newEmail.trim()}
                className="w-full sm:w-auto h-11 sm:h-12 px-4 rounded-xl bg-purple-600 hover:bg-purple-700"
              >
                {addingEmail ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Tambah Email
              </Button>
            </div>

            {allowedEmails.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">Belum ada email yang diizinkan</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allowedEmails.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                        {item.is_registered ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Mail className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{item.email}</p>
                          {item.role === 'admin' && (
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {item.full_name && <span>{item.full_name}</span>}
                          {item.is_registered ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Terdaftar
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Belum daftar
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAllowedEmail(item.id, item.email)}
                      disabled={deletingEmail === item.id}
                      className="w-9 h-9 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deletingEmail === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-400 mt-4">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Hanya email dalam daftar ini yang dapat mendaftar via Google.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-gray-100 shadow-subtle">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Dompet</CardTitle>
              <CardDescription>Kelola daftar dompet Anda</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nama dompet baru (e.g., GoPay)"
              value={newWallet}
              onChange={(e) => setNewWallet(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addWallet()}
              className="h-11 sm:h-12 rounded-xl border-gray-200"
              disabled={adding}
            />
            <Button 
              onClick={() => addWallet()} 
              disabled={adding || !newWallet.trim()}
              className="h-11 sm:h-12 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">Belum ada dompet</p>
              <p className="text-gray-400 text-xs mt-1">Tambah dompet pertama Anda di atas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{wallet.name}</p>
                      <p className="text-sm text-gray-500">
                        Saldo: Rp {(wallet.saldo || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteWallet(wallet.id, wallet.name)}
                    disabled={deleting === wallet.id}
                    className="w-9 h-9 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deleting === wallet.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <p className="text-xs text-gray-400 mt-4">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            Dompet yang sudah terintegrasi dengan transaksi tidak dapat dihapus.
          </p>
        </CardContent>
      </Card>
      <ConfirmDialog />
    </div>
  )
}