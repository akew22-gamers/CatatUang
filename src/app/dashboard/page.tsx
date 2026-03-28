'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, TrendingUp, TrendingDown, Wallet, CheckCircle2, XCircle, AlertCircle, Loader2, Trash2, DollarSign, Copy, Check, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/use-confirm'

interface Message {
  id?: number
  role: 'user' | 'assistant'
  content: string | React.ReactNode
  data?: any
  transaction_status?: 'pending' | 'accepted' | 'rejected' | null
  timestamp: Date
  sender_id?: string
  sender_name?: string
  sender_role?: 'admin' | 'user'
  reply_to?: {
    sender_name: string
    sender_role: 'admin' | 'user'
  }
}

const userColors = [
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-violet-600',
  'bg-pink-600',
  'bg-teal-600',
]

const getUserColor = (senderId: string, currentUserId: string) => {
  if (senderId === currentUserId) return 'bg-indigo-600'
  const index = Math.abs(hashCode(senderId)) % (userColors.length - 1) + 1
  return userColors[index]
}

const hashCode = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [wallets, setWallets] = useState<string[]>([])
  const [walletsLoaded, setWalletsLoaded] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    initialize()
  }, [])
  
  useEffect(() => {
    if (scrollContainerRef.current && messages.length > 0) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [messages])

  const initialize = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      setUserId(user.id)
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role, email')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('Error loading profile:', profileError)
      }
      
      if (profile) {
        setUserName(profile.full_name || profile.email || 'User')
        setUserRole((profile.role as 'admin' | 'user') || 'user')
      }
      
      await Promise.all([
        loadWallets(),
        loadChatHistory()
      ])
    } else {
      console.error('No user found in initialize')
      setHistoryLoaded(true)
      setWalletsLoaded(true)
    }
  }

  const loadWallets = async () => {
    const supabase = createClient()
    
    try {
      const { data: walletData, error } = await supabase
        .from('wallets')
        .select('name')
        .eq('group_id', 1)
        .order('name')
      
      if (error) {
        console.error('Error loading wallets:', error)
      } else if (walletData && walletData.length > 0) {
        const walletNames = walletData.map(w => w.name)
        setWallets(walletNames)
      }
    } catch (error) {
      console.error('Failed to load wallets:', error)
    } finally {
      setWalletsLoaded(true)
    }
  }

  const loadChatHistory = async () => {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('group_id', 1)
        .order('created_at', { ascending: true })
        .limit(100)
      
      if (error) {
        console.error('Error loading chat history:', error)
      } else if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map((msg: any) => {
          try {
            return {
              id: msg.id,
              role: msg.role,
              content: msg.role === 'user' ? msg.content : renderAssistantContent(msg.data || { pesan_balasan: msg.content }, msg.transaction_status, msg.reply_to),
              data: msg.data,
              transaction_status: msg.transaction_status,
              timestamp: new Date(msg.created_at),
              sender_id: msg.user_id,
              sender_name: msg.sender_name,
              sender_role: msg.sender_role,
              reply_to: msg.reply_to
            }
          } catch (e) {
            console.error('Error processing message:', e, msg)
            return {
              id: msg.id,
              role: msg.role,
              content: msg.content || 'Error loading message',
              data: msg.data,
              transaction_status: msg.transaction_status,
              timestamp: new Date(msg.created_at),
              sender_id: msg.user_id,
              sender_name: msg.sender_name,
              sender_role: msg.sender_role,
              reply_to: msg.reply_to
            }
          }
        })
        setMessages(loadedMessages)
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    } finally {
      setHistoryLoaded(true)
    }
  }

  const saveMessage = async (role: 'user' | 'assistant', content: string, data?: any) => {
    if (!userId) return null
    
    const supabase = createClient()
    
    const insertData: any = {
      user_id: userId,
      group_id: 1,
      role,
      content,
      data: data || null,
      sender_name: userName,
      sender_role: userRole
    }
    
    if (role === 'assistant' && data?.transaksi) {
      insertData.transaction_status = 'pending'
    }
    
    try {
      const { data: savedData, error } = await supabase
        .from('chat_messages')
        .insert(insertData)
        .select('id')
        .single()
      
      if (error) {
        console.error('Error saving message:', error)
        return null
      }
      
      return savedData?.id
    } catch (error) {
      console.error('Failed to save message:', error)
      return null
    }
  }

  const updateMessageInDatabase = async (messageId: number, data: any) => {
    const supabase = createClient()
    try {
      const { error } = await (supabase as any)
        .from('chat_messages')
        .update({ data })
        .eq('id', messageId)
      
      if (error) {
        console.error('Error updating message in database:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Failed to update message in database:', error)
      return false
    }
  }

  const renderAssistantContent = (parsed: any, transactionStatus?: 'pending' | 'accepted' | 'rejected' | null, replyTo?: { sender_name: string; sender_role: 'admin' | 'user' }) => {
    const renderWithReplyTo = (content: React.ReactNode) => {
      if (!replyTo) return content
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-md px-2 py-1.5">
            <User className="h-3 w-3" />
            <span className="font-medium">Balasan untuk {replyTo.sender_name}</span>
            {replyTo.sender_role === 'admin' && (
              <Badge variant="default" className="text-[9px] h-4 px-1">Admin</Badge>
            )}
          </div>
          {content}
        </div>
      )
    }

    if (transactionStatus === 'accepted') {
      const transactions = parsed.transaksi || []
      return renderWithReplyTo(
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 sm:gap-3 text-green-700">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
            <span className="font-semibold text-sm sm:text-base">
              {transactions.length > 1 ? `${transactions.length} Transaksi Berhasil Disimpan` : 'Berhasil Disimpan'}
            </span>
          </div>
          {transactions.length > 0 && (
            <div className="space-y-2">
              {transactions.map((tx: any, idx: number) => (
                <div key={idx} className="grid gap-1.5 sm:gap-2 text-xs sm:text-sm bg-green-50/50 rounded-lg p-2.5 sm:p-3 border border-green-100">
                  {transactions.length > 1 && (
                    <div className="text-xs font-semibold text-green-600 mb-1">#{idx + 1}</div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-green-600">Jenis:</span>
                    <Badge variant={tx.jenis === 'pemasukan' ? 'default' : 'destructive'} className="font-medium text-[10px] sm:text-xs">
                      {tx.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600">Jumlah:</span>
                    <span className="font-semibold text-gray-900 text-xs sm:text-sm">Rp {tx.nominal?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600">Keterangan:</span>
                    <span className="text-gray-700 text-xs sm:text-sm">{tx.keterangan}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600">Dompet:</span>
                    <span className="font-medium text-gray-900 text-xs sm:text-sm">{tx.dompet || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
    
    if (transactionStatus === 'rejected') {
      const transactions = parsed.transaksi || []
      return renderWithReplyTo(
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 sm:gap-3 text-red-700">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
              <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
            <span className="font-semibold text-sm sm:text-base">
              {transactions.length > 1 ? `${transactions.length} Transaksi Dibatalkan` : 'Dibatalkan'}
            </span>
          </div>
          {transactions.length > 0 && (
            <div className="space-y-2">
              {transactions.map((tx: any, idx: number) => (
                <div key={idx} className="grid gap-1.5 sm:gap-2 text-xs sm:text-sm bg-red-50/50 rounded-lg p-2.5 sm:p-3 border border-red-100">
                  {transactions.length > 1 && (
                    <div className="text-xs font-semibold text-red-600 mb-1">#{idx + 1}</div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-red-600">Jenis:</span>
                    <Badge variant={tx.jenis === 'pemasukan' ? 'default' : 'destructive'} className="font-medium text-[10px] sm:text-xs">
                      {tx.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-600">Jumlah:</span>
                    <span className="font-semibold text-gray-900 text-xs sm:text-sm">Rp {tx.nominal?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-600">Keterangan:</span>
                    <span className="text-gray-700 text-xs sm:text-sm">{tx.keterangan}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-600">Dompet:</span>
                    <span className="font-medium text-gray-900 text-xs sm:text-sm">{tx.dompet || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
    
    if (parsed.status === 'cek_saldo') {
      const saldoInfo = parsed.saldo_info || []
      const totalSaldo = parsed.total_saldo || 0
      
      return renderWithReplyTo(
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 sm:gap-3 text-indigo-600">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span className="font-semibold text-gray-900 text-sm sm:text-base">Saldo Dompet</span>
          </div>
          <div className="grid gap-2 sm:gap-3 text-sm bg-gray-50/50 rounded-xl p-3 sm:p-4">
            {saldoInfo.map((wallet: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-gray-600 text-xs sm:text-sm">{wallet.name}</span>
                <span className="font-semibold text-gray-900 text-xs sm:text-sm">Rp {wallet.saldo.toLocaleString('id-ID')}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-700 text-xs sm:text-sm">Total</span>
              <span className="font-bold text-indigo-600 text-sm sm:text-base">Rp {totalSaldo.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      )
    }
    
    if (parsed.status === 'cek_profile') {
      const profile = parsed.profile_info
      
      if (!profile) {
        return renderWithReplyTo(
          <div className="space-y-3">
            <div className="flex items-center gap-2 sm:gap-3 text-amber-600">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="font-semibold text-gray-900 text-sm sm:text-base">Silakan login terlebih dahulu</span>
            </div>
          </div>
        )
      }
      
      return renderWithReplyTo(
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 sm:gap-3 text-indigo-600">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span className="font-semibold text-gray-900 text-sm sm:text-base">Profil Anda</span>
          </div>
          <div className="space-y-3 bg-gray-50/50 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg sm:text-xl">
                  {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm sm:text-base">{profile.full_name}</p>
                <p className="text-xs sm:text-sm text-gray-500">{profile.email}</p>
              </div>
            </div>
            <div className="grid gap-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Role</span>
                <span className={`font-medium px-2 py-0.5 rounded text-xs ${profile.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                  {profile.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Jumlah Dompet</span>
                <span className="font-medium text-gray-900">{profile.total_wallets} dompet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Saldo</span>
                <span className="font-semibold text-indigo-600">Rp {profile.total_saldo?.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Transaksi</span>
                <span className="font-medium text-gray-900">{profile.total_transactions} transaksi</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Bergabung sejak</span>
                <span className="font-medium text-gray-900">
                  {new Date(profile.created_at).toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    if (parsed.status === 'saved') {
      return renderWithReplyTo(
        <div className="flex items-center gap-2 sm:gap-3 text-green-600">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <span className="font-semibold text-sm sm:text-base">Transaksi berhasil disimpan!</span>
        </div>
      )
    }
    
    if (parsed.status === 'cancelled') {
      return renderWithReplyTo(
        <div className="flex items-center gap-2 sm:gap-3 text-gray-500">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <span className="text-sm sm:text-base">Transaksi dibatalkan.</span>
        </div>
      )
    }
    
    if (parsed.status === 'error') {
      return renderWithReplyTo(
        <div className="flex items-start gap-2 sm:gap-3 text-red-600">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div>
            <span className="font-semibold text-gray-900 text-sm sm:text-base">Gagal Menyimpan</span>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">{parsed.pesan_balasan}</p>
          </div>
        </div>
      )
    }
    
    if (parsed.status === 'need_amount') {
      return renderWithReplyTo(
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start gap-2 sm:gap-3 text-indigo-600">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-sm sm:text-base">Nominal Berapa?</span>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">{parsed.pesan_balasan}</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-gray-500 text-sm">Rp</span>
            <Input
              type="number"
              placeholder="50000"
              className="h-9 sm:h-10 rounded-lg border-gray-200"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAmountSubmit(parsed.originalMessage, (e.target as HTMLInputElement).value)
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                const inputs = document.querySelectorAll('input[type="number"]')
                const input = inputs[inputs.length - 1] as HTMLInputElement
                if (input && input.value) {
                  handleAmountSubmit(parsed.originalMessage, input.value)
                }
              }}
              className="h-9 sm:h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700"
            >
              Ok
            </Button>
          </div>
        </div>
      )
    }
    
if (parsed.status === 'lengkap') {
      const transactions = parsed.transaksi || []
      if (transactions.length === 0) return renderWithReplyTo(parsed.pesan_balasan || '')
      
      return renderWithReplyTo(
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 sm:gap-3 text-green-600">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span className="font-semibold text-gray-900 text-sm sm:text-base">
              {transactions.length > 1 ? `${transactions.length} Transaksi Siap Disimpan` : 'Transaksi Siap Disimpan'}
            </span>
          </div>
          {transactions.map((tx: any, idx: number) => (
            <div key={idx} className="grid gap-2 sm:gap-3 text-sm bg-gray-50/50 rounded-xl p-3 sm:p-4">
              {transactions.length > 1 && (
                <div className="text-xs font-semibold text-gray-500 mb-1">#{idx + 1}</div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs sm:text-sm">Jenis:</span>
                <Badge variant={tx.jenis === 'pemasukan' ? 'default' : 'destructive'} className="font-medium text-xs">
                  {tx.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs sm:text-sm">Jumlah:</span>
                <span className="font-semibold text-gray-900 text-sm sm:text-base">
                  {tx.nominal ? `Rp ${tx.nominal.toLocaleString('id-ID')}` : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs sm:text-sm">Keterangan:</span>
                <span className="text-gray-700 text-xs sm:text-sm">{tx.keterangan}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs sm:text-sm">Dompet:</span>
                <span className="font-medium text-gray-900 text-xs sm:text-sm">{tx.dompet || 'Belum dipilih'}</span>
              </div>
            </div>
          ))}
        </div>
      )
    }
    
    if (parsed.status === 'kurang_data') {
      const transactions = parsed.transaksi || []
      const transactionsWithNominal = transactions.filter((tx: any) => tx.nominal && tx.nominal > 0)
      const transactionsWithoutNominal = transactions.filter((tx: any) => !tx.nominal || tx.nominal <= 0)
      
      return renderWithReplyTo(
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start gap-2 sm:gap-3 text-amber-600">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-sm sm:text-base">Data Belum Lengkap</span>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">{parsed.pesan_balasan}</p>
            </div>
          </div>
          
          {transactionsWithNominal.length > 0 && transactionsWithoutNominal.length === 0 && (
            <div className="space-y-2">
              {transactionsWithNominal.map((tx: any, idx: number) => (
                <div key={idx} className="grid gap-2 sm:gap-3 text-sm bg-gray-50/50 rounded-xl p-3 sm:p-4">
                  {transactions.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">#{transactions.indexOf(tx) + 1}</span>
                      <span className="text-xs text-gray-600">{tx.keterangan}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs sm:text-sm">Jenis:</span>
                    <Badge variant={tx.jenis === 'pemasukan' ? 'default' : 'destructive'} className="font-medium text-xs">
                      {tx.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs sm:text-sm">Jumlah:</span>
                    <span className="font-semibold text-gray-900 text-sm sm:text-base">Rp {tx.nominal?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs sm:text-sm">Keterangan:</span>
                    <span className="text-gray-700 text-xs sm:text-sm">{tx.keterangan}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs sm:text-sm">Dompet:</span>
                    <span className="font-medium text-amber-600 text-xs sm:text-sm">{tx.dompet || 'Belum dipilih'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
    
    if (parsed.status === 'ditolak') {
      return renderWithReplyTo(
        <div className="flex items-start gap-2 sm:gap-3 text-red-600">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div>
            <span className="font-semibold text-gray-900 text-sm sm:text-base">Transaksi Ditolak</span>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-line">{parsed.pesan_balasan}</p>
          </div>
        </div>
      )
    }
    
    if (parsed.status === 'ambigu') {
      return renderWithReplyTo(
        <div className="flex items-start gap-2 sm:gap-3 text-amber-600">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div>
            <span className="font-semibold text-gray-900 text-sm sm:text-base">Data Ambigu</span>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">{parsed.pesan_balasan}</p>
          </div>
        </div>
      )
    }
    
    return renderWithReplyTo(
      <div className="text-xs sm:text-sm text-gray-700 leading-relaxed">
        {parsed.pesan_balasan || ''}
      </div>
    )
  }

  const updateMessageStatus = async (messageIndex: number, newStatus: 'accepted' | 'rejected') => {
    const msg = messages[messageIndex]
    if (!msg) return
    
    setMessages(prev => {
      const newMessages = [...prev]
      const currentMsg = newMessages[messageIndex]
      if (currentMsg) {
        currentMsg.content = renderAssistantContent(currentMsg.data, newStatus)
        currentMsg.transaction_status = newStatus
      }
      return newMessages
    })
    
    if (msg.id) {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from('chat_messages')
        .update({ transaction_status: newStatus })
        .eq('id', msg.id)
      
      if (error) {
        console.error('Error updating message in database:', error)
        toast.error('Gagal memperbarui status di database')
      }
    }
  }

  const handleSave = async (data: any, messageIndex: number) => {
    setLoading(true)
    try {
      const response = await fetch('/api/confirmations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId || 'anonymous',
          group_id: 1,
          original_message: messages[messageIndex - 1]?.content as string,
          parsed_data: data,
        }),
      })

      const result = await response.json()
      if (result.error) throw new Error(result.error)

      await updateMessageStatus(messageIndex, 'accepted')
      toast.success('Transaksi berhasil disimpan!')
    } catch (error: any) {
      console.error('Save error:', error)
      
      await updateMessageStatus(messageIndex, 'rejected')
      
      const errorData = { status: 'error', pesan_balasan: error.message }
      const errorMsg: Message = {
        role: 'assistant',
        content: renderAssistantContent(errorData),
        data: errorData,
        timestamp: new Date(),
      }
      const msgId = await saveMessage('assistant', error.message, errorData)
      if (msgId) errorMsg.id = msgId
      setMessages(prev => [...prev, errorMsg])
      
      toast.error('Transaksi gagal: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (messageIndex: number) => {
    await updateMessageStatus(messageIndex, 'rejected')
    toast.info('Transaksi dibatalkan')
  }

  const hasTransactionsWithoutWallet = (transactions: any[]): boolean => {
    return transactions.some((tx: any) => !tx.dompet)
  }

  const hasTransactionsWithoutNominal = (transactions: any[]): boolean => {
    return transactions.some((tx: any) => !tx.nominal || tx.nominal <= 0)
  }

  const hasTransactionsWithWallet = (transactions: any[]): boolean => {
    return transactions.some((tx: any) => tx.dompet)
  }

  const allTransactionsHaveWallet = (transactions: any[]): boolean => {
    return transactions.every((tx: any) => tx.dompet)
  }

  const handleWalletSelectSingle = async (walletName: string, messageIndex: number, txIndex?: number) => {
    setMessages(prev => {
      const newMessages = [...prev]
      const msg = newMessages[messageIndex]
      if (msg && msg.data) {
        if (txIndex !== undefined) {
          msg.data.transaksi[txIndex].dompet = walletName
        } else {
          for (const tx of msg.data.transaksi) {
            tx.dompet = walletName
          }
        }
        
        if (allTransactionsHaveWallet(msg.data.transaksi) && !hasTransactionsWithoutNominal(msg.data.transaksi)) {
          msg.data.status = 'lengkap'
        }
        msg.content = renderAssistantContent(msg.data)
        
        if (msg.id) {
          updateMessageInDatabase(msg.id, msg.data)
        }
      }
      return newMessages
    })
  }

  const handleWalletSelect = async (walletName: string, messageIndex: number) => {
    setMessages(prev => {
      const newMessages = [...prev]
      const msg = newMessages[messageIndex]
      if (msg && msg.data) {
        for (const tx of msg.data.transaksi) {
          tx.dompet = walletName
        }
        msg.data.status = 'lengkap'
        msg.content = renderAssistantContent(msg.data)
        
        if (msg.id) {
          updateMessageInDatabase(msg.id, msg.data)
        }
      }
      return newMessages
    })
  }

  const copyToClipboard = async (text: string, messageId?: number) => {
    try {
      await navigator.clipboard.writeText(text)
      if (messageId) {
        setCopiedId(messageId)
        setTimeout(() => setCopiedId(null), 2000)
      }
      toast.success('Disalin ke clipboard')
    } catch (error) {
      toast.error('Gagal menyalin')
    }
  }

  const clearChatHistory = async () => {
    if (!userId) return
    
    const confirmed = await confirm({
      title: "Hapus Riwayat Chat",
      description: "Apakah Anda yakin ingin menghapus semua pesan dari riwayat chat?",
      confirmText: "Hapus",
      cancelText: "Batal"
    })
    
    if (!confirmed) return
    
    const supabase = createClient()
    
    try {
      const { error } = await (supabase as any)
        .from('chat_messages')
        .delete()
        .eq('group_id', 1)
      
      if (error) {
        console.error('Error clearing chat:', error)
        toast.error('Gagal menghapus riwayat chat')
      } else {
        await loadChatHistory()
        toast.success('Semua pesan berhasil dihapus')
      }
    } catch (error) {
      console.error('Failed to clear chat:', error)
      toast.error('Gagal menghapus riwayat chat')
    }
  }

  const containsAmount = (text: string): boolean => {
    const amountPatterns = [
      /\d{2,}/,
      /\d{1,3}(?:[.,]\d{3})+/,
      /\d+(?:rb|ribu|juta|jt|k)/i,
      /\d+\s*(?:rb|ribu|juta|jt|k)/i,
    ]
    return amountPatterns.some(pattern => pattern.test(text))
  }

  const looksLikeMultiTransaction = (text: string): boolean => {
    const separators = [' dan ', ',', ';', ' lalu ', ' terus ', ' terus ']
    for (const sep of separators) {
      if (text.includes(sep)) {
        const parts = text.split(sep).filter(s => s.trim())
        if (parts.length > 1) {
          const transactionKeywords = [
            'beli', 'makan', 'minum', 'bayar', 'gaji', 'bonus', 'transfer', 'tarik', 'setor',
            'isi', 'pulsa', 'listrik', 'air', 'internet', 'tagihan', 'cicilan', 'utang',
            'pinjam', 'kembali', 'jual', 'belanja', 'ngopi', 'jajan', 'snack', 'ojek',
            'gojek', 'grab', 'shopee', 'tokopedia', 'pump', 'bensin', 'parkir', 'tol'
          ]
          const partsWithTransaction = parts.filter(part => 
            transactionKeywords.some(kw => part.toLowerCase().includes(kw))
          )
          if (partsWithTransaction.length > 1) {
            return true
          }
        }
      }
    }
    return false
  }

  const looksLikeTransaction = (text: string): boolean => {
    const transactionKeywords = [
      'beli', 'makan', 'minum', 'bayar', 'gaji', 'bonus', 'transfer', 'tarik', ' setor',
      'isi', 'pulsa', 'listrik', 'air', 'internet', 'tagihan', 'cicilan', 'utang',
      'pinjam', 'kembali', 'jual', 'belanja', 'ngopi', 'jajan', 'snack', 'ojek',
      'gojek', 'grab', 'shopee', 'tokopedia', 'pump', 'bensin', 'parkir', 'tol'
    ]
    const lowerText = text.toLowerCase()
    return transactionKeywords.some(keyword => lowerText.includes(keyword))
  }

  const handleAmountSubmit = async (originalMessage: string, amount: string) => {
    if (!amount.trim()) {
      toast.error('Masukkan nominal transaksi')
      return
    }
    
    setLoading(true)
    
    const combinedMessage = `${originalMessage} ${amount}`
    
    const lastUserMessage = messages.length > 0 ? messages[messages.length - 1] : null
    const replyTo = lastUserMessage && lastUserMessage.role === 'user' && lastUserMessage.sender_name && lastUserMessage.sender_role
      ? { sender_name: lastUserMessage.sender_name, sender_role: lastUserMessage.sender_role }
      : undefined
    
    const userMsg: Message = {
      role: 'user',
      content: combinedMessage,
      timestamp: new Date(),
      sender_id: userId || undefined,
      sender_name: userName,
      sender_role: userRole
    }
    
    const userMsgId = await saveMessage('user', combinedMessage)
    if (userMsgId) userMsg.id = userMsgId
    setMessages(prev => [...prev, userMsg])

    try {
      const response = await fetch('/api/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: combinedMessage }),
      })

      const result = await response.json()

      if (result.error) {
        const errorData = { status: 'error', pesan_balasan: result.error }
        const errorMsg: Message = {
          role: 'assistant',
          content: renderAssistantContent(errorData, undefined, replyTo),
          data: errorData,
          timestamp: new Date(),
          reply_to: replyTo
        }
        const msgId = await saveMessage('assistant', result.error, errorData)
        if (msgId) errorMsg.id = msgId
        setMessages(prev => [...prev, errorMsg])
        return
      }

      const parsed = result.data
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: renderAssistantContent(parsed, parsed.transaksi ? 'pending' : null, replyTo),
        data: parsed,
        transaction_status: parsed.transaksi ? 'pending' : null,
        timestamp: new Date(),
        reply_to: replyTo
      }
      
      const msgId = await saveMessage('assistant', parsed.pesan_balasan || '', parsed)
      if (msgId) assistantMsg.id = msgId
      setMessages(prev => [...prev, assistantMsg])
    } catch (error: any) {
      const errorData = { status: 'error', pesan_balasan: error.message }
      const errorMsg: Message = {
        role: 'assistant',
        content: renderAssistantContent(errorData, undefined, replyTo),
        data: errorData,
        timestamp: new Date(),
        reply_to: replyTo
      }
      const msgId = await saveMessage('assistant', error.message, errorData)
      if (msgId) errorMsg.id = msgId
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    
    const lastUserMessage = messages.length > 0 ? messages[messages.length - 1] : null
    const replyTo = lastUserMessage && lastUserMessage.role === 'user' && lastUserMessage.sender_name && lastUserMessage.sender_role
      ? { sender_name: lastUserMessage.sender_name, sender_role: lastUserMessage.sender_role }
      : undefined
    
    if (looksLikeTransaction(userMessage) && !containsAmount(userMessage)) {
      if (looksLikeMultiTransaction(userMessage)) {
        // Multi-transaction without amount - let AI handle it (will reject)
      } else {
        // Single transaction without amount - ask for nominal
        const userMsg: Message = {
          role: 'user',
          content: userMessage,
          timestamp: new Date(),
          sender_id: userId || undefined,
          sender_name: userName,
          sender_role: userRole
        }
        
        const userMsgId = await saveMessage('user', userMessage)
        if (userMsgId) userMsg.id = userMsgId
        setMessages(prev => [...prev, userMsg])
        
        const needAmountData = { 
          status: 'need_amount', 
          pesan_balasan: 'Sepertinya ini transaksi, tapi nominalnya berapa?',
          originalMessage: userMessage 
        }
        
        const assistantMsg: Message = {
          role: 'assistant',
          content: renderAssistantContent(needAmountData, undefined, replyTo),
          data: needAmountData,
          timestamp: new Date(),
          reply_to: replyTo
        }
        
        const msgId = await saveMessage('assistant', needAmountData.pesan_balasan, needAmountData)
        if (msgId) assistantMsg.id = msgId
        setMessages(prev => [...prev, assistantMsg])
        return
      }
    }
    
    setLoading(true)
    
    const userMsg: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      sender_id: userId || undefined,
      sender_name: userName,
      sender_role: userRole
    }
    
    const userMsgId = await saveMessage('user', userMessage)
    if (userMsgId) userMsg.id = userMsgId
    setMessages(prev => [...prev, userMsg])

    try {
      const response = await fetch('/api/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      const result = await response.json()

      if (result.error) {
        const errorData = { status: 'error', pesan_balasan: result.error }
        const errorMsg: Message = {
          role: 'assistant',
          content: renderAssistantContent(errorData, undefined, replyTo),
          data: errorData,
          timestamp: new Date(),
          reply_to: replyTo
        }
        const msgId = await saveMessage('assistant', result.error, errorData)
        if (msgId) errorMsg.id = msgId
        setMessages(prev => [...prev, errorMsg])
        return
      }

      const parsed = result.data
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: renderAssistantContent(parsed, parsed.transaksi ? 'pending' : null, replyTo),
        data: parsed,
        transaction_status: parsed.transaksi ? 'pending' : null,
        timestamp: new Date(),
        reply_to: replyTo
      }
      
      const msgId = await saveMessage('assistant', parsed.pesan_balasan || '', parsed)
      if (msgId) assistantMsg.id = msgId
      setMessages(prev => [...prev, assistantMsg])
    } catch (error: any) {
      const errorData = { status: 'error', pesan_balasan: error.message }
      const errorMsg: Message = {
        role: 'assistant',
        content: renderAssistantContent(errorData, undefined, replyTo),
        data: errorData,
        timestamp: new Date(),
        reply_to: replyTo
      }
      const msgId = await saveMessage('assistant', error.message, errorData)
      if (msgId) errorMsg.id = msgId
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  if (!historyLoaded) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] md:h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Memuat chat...</p>
        </div>
      </div>
    )
  }

  const getMessageText = (msg: Message): string => {
    if (msg.role === 'user') {
      let text = msg.content as string
      if (msg.sender_name && msg.sender_id !== userId) {
        text = `[${msg.sender_name}${msg.sender_role === 'admin' ? ' (Admin)' : ''}]\n${text}`
      }
      return text
    }
    
    if (msg.transaction_status === 'accepted') {
      const transactions = msg.data?.transaksi || []
      if (transactions.length > 0) {
        let text = `Status: Berhasil Disimpan (${transactions.length} transaksi)\n`
        transactions.forEach((tx: any, idx: number) => {
          text += `\n#${idx + 1}\n`
          text += `Jenis: ${tx.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}\n`
          text += `Jumlah: Rp ${tx.nominal?.toLocaleString('id-ID')}\n`
          text += `Keterangan: ${tx.keterangan}\n`
          text += `Dompet: ${tx.dompet || '-'}\n`
        })
        return text
      }
      return 'Transaksi berhasil disimpan!'
    }
    if (msg.transaction_status === 'rejected') {
      const transactions = msg.data?.transaksi || []
      if (transactions.length > 0) {
        let text = `Status: Dibatalkan (${transactions.length} transaksi)\n`
        transactions.forEach((tx: any, idx: number) => {
          text += `\n#${idx + 1}\n`
          text += `Jenis: ${tx.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}\n`
          text += `Jumlah: Rp ${tx.nominal?.toLocaleString('id-ID')}\n`
          text += `Keterangan: ${tx.keterangan}\n`
          text += `Dompet: ${tx.dompet || '-'}\n`
        })
        return text
      }
      return 'Transaksi dibatalkan.'
    }
    if (msg.data?.status === 'cek_saldo') {
      const saldoInfo = msg.data?.saldo_info || []
      const totalSaldo = msg.data?.total_saldo || 0
      let text = 'Saldo Dompet:\n'
      saldoInfo.forEach((w: any) => {
        text += `${w.name}: Rp ${w.saldo.toLocaleString('id-ID')}\n`
      })
      text += `Total: Rp ${totalSaldo.toLocaleString('id-ID')}`
      return text
    }
    if (msg.data?.status === 'cek_profile') {
      const profile = msg.data?.profile_info
      if (!profile) return 'Silakan login terlebih dahulu'
      return `Profil:\nNama: ${profile.full_name}\nEmail: ${profile.email}\nRole: ${profile.role}\nDompet: ${profile.total_wallets}\nTotal Saldo: Rp ${profile.total_saldo?.toLocaleString('id-ID')}\nTransaksi: ${profile.total_transactions}\nBergabung: ${new Date(profile.created_at).toLocaleDateString('id-ID')}`
    }
    if (msg.data?.status === 'saved') {
      return 'Transaksi berhasil disimpan!'
    }
    if (msg.data?.status === 'cancelled') {
      return 'Transaksi dibatalkan.'
    }
    if (msg.data?.status === 'error') {
      return `Gagal: ${msg.data.pesan_balasan}`
    }
    if (msg.data?.status === 'need_amount') {
      return `Nominal berapa? ${msg.data.pesan_balasan || ''}`
    }
    
    const transactions = msg.data?.transaksi || []
    if (transactions.length > 0) {
      let text = `${transactions.length} Transaksi:\n`
      transactions.forEach((tx: any, idx: number) => {
        text += `#${idx + 1} ${tx.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} - Rp ${tx.nominal?.toLocaleString('id-ID') || '?'} - ${tx.keterangan} (${tx.dompet || 'Belum dipilih'})\n`
      })
      return text.trim()
    }
    
    return msg.data?.pesan_balasan || ''
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pb-4"
      >
        <div className="flex flex-col justify-end min-h-full p-3 sm:p-4 md:p-6 max-w-3xl mx-auto">
          <div className="space-y-4 sm:space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6 px-4 py-8">
                <div className="space-y-2">
                  <p className="text-lg sm:text-xl font-medium text-gray-700">
                    Halo! 👋
                  </p>
                  <p className="text-gray-500 text-sm sm:text-base">
                    Ketik transaksi kamu di bawah untuk mulai mencatat
                  </p>
                </div>
                
                <Card className="w-full max-w-sm sm:max-w-md border-gray-100 shadow-subtle bg-white/80 backdrop-blur">
                  <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
                    <div className="space-y-2 sm:space-y-3">
                      <p className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500" />
                        Contoh penggunaan:
                      </p>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 hover:shadow-sm transition-all duration-200 cursor-pointer group">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <span className="text-gray-600 text-xs sm:text-sm">Gaji masuk 15 juta ke BCA</span>
                            <Badge className="ml-2 bg-green-100 text-green-700 hover:bg-green-100 border-0 text-xs">Pemasukan</Badge>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 hover:shadow-sm transition-all duration-200 cursor-pointer group">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <span className="text-gray-600 text-xs sm:text-sm">Beli makan siang 50rb pakai gopay</span>
                            <Badge className="ml-2 bg-red-100 text-red-700 hover:bg-red-100 border-0 text-xs">Pengeluaran</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={msg.id || i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up group`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {msg.role === 'assistant' && (
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-1 flex-shrink-0 shadow-md ${
                      msg.transaction_status === 'accepted' 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                        : msg.transaction_status === 'rejected'
                        ? 'bg-gradient-to-br from-red-500 to-rose-600'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                    }`}>
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col max-w-[90%] sm:max-w-[85%] md:max-w-[75%]">
                    {msg.role === 'user' && msg.sender_id && msg.sender_id !== userId && (
                      <div className="flex items-center gap-1.5 mb-1 ml-auto">
                        <span className="text-xs font-medium text-gray-600">{msg.sender_name}</span>
                        {msg.sender_role === 'admin' && (
                          <Badge variant="default" className="text-[9px] h-4 px-1">Admin</Badge>
                        )}
                      </div>
                    )}
                    <Card className={`shadow-subtle border-0 ${
                      msg.role === 'user' 
                        ? `${getUserColor(msg.sender_id || '', userId || '')} text-white rounded-2xl rounded-br-md` 
                        : msg.transaction_status === 'accepted'
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl rounded-bl-md'
                        : msg.transaction_status === 'rejected'
                        ? 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl rounded-bl-md'
                        : 'bg-white rounded-2xl rounded-bl-md'
                    }`}>
                      <CardContent className={`p-3 sm:p-4 ${msg.role === 'user' ? 'pb-1 sm:pb-2' : ''}`}>
                        {msg.role === 'user' ? (
                          <p className="leading-relaxed text-sm sm:text-base">{msg.content as string}</p>
                        ) : (
                          <div className="space-y-3 sm:space-y-4">
                            {msg.content}
                            
                            {msg.data?.transaksi?.length > 0 && hasTransactionsWithoutWallet(msg.data.transaksi) && msg.transaction_status !== 'accepted' && msg.transaction_status !== 'rejected' && msg.data?.status !== 'saved' && msg.data?.status !== 'cancelled' && msg.data?.status !== 'error' && (
                              <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-gray-100">
                                {msg.data.transaksi.length > 1 ? (
                                  <>
                                    <p className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                                      <Wallet className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                      {msg.data.transaksi.length} Transaksi - Pilih dompet:
                                    </p>
                                    
                                    {(msg.data._showPerTransaction || (hasTransactionsWithWallet(msg.data.transaksi) && hasTransactionsWithoutWallet(msg.data.transaksi))) ? (
                                      <div className="space-y-3">
                                        {msg.data.transaksi.map((tx: any, txIdx: number) => (
                                          <div key={txIdx} className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
                                            <div className="flex items-center justify-between mb-2">
                                              <div>
                                                <span className="text-xs font-medium text-gray-700">{tx.keterangan}</span>
                                                <Badge variant={tx.jenis === 'pemasukan' ? 'default' : 'destructive'} className="ml-2 text-[10px]">
                                                  {tx.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                                                </Badge>
                                              </div>
                                              <span className="text-xs font-semibold text-gray-900">
                                                {tx.nominal ? `Rp ${tx.nominal.toLocaleString('id-ID')}` : 'Nominal?'}
                                              </span>
                                            </div>
                                            {tx.dompet ? (
                                              <span className="text-xs text-green-600 font-medium">✓ {tx.dompet}</span>
                                            ) : (
                                              <div className="flex flex-wrap gap-1.5">
                                                {walletsLoaded && wallets.map((wallet) => (
                                                  <Button
                                                    key={wallet}
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleWalletSelectSingle(wallet, i, txIdx)}
                                                    className="text-[10px] h-7 rounded-md border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                                                  >
                                                    {wallet}
                                                  </Button>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                          {walletsLoaded ? (
                                            wallets.map((wallet) => (
                                              <Button
                                                key={wallet}
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleWalletSelect(wallet, i)}
                                                className="text-xs h-8 sm:h-9 rounded-lg border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
                                              >
                                                {wallet}
                                              </Button>
                                            ))
                                          ) : (
                                            <div className="flex gap-1.5 sm:gap-2">
                                              <Skeleton className="h-8 sm:h-9 w-16 sm:w-20 rounded-lg" />
                                              <Skeleton className="h-8 sm:h-9 w-16 sm:w-20 rounded-lg" />
                                            </div>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => {
                                            setMessages(prev => {
                                              const newMessages = [...prev]
                                              const m = newMessages[i]
                                              if (m && m.data) {
                                                m.data._showPerTransaction = true
                                                m.content = renderAssistantContent(m.data)
                                              }
                                              return newMessages
                                            })
                                          }}
                                          className="text-xs text-indigo-600 hover:text-indigo-700 underline"
                                        >
                                          Atau pilih dompet berbeda per transaksi
                                        </button>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <p className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                                      <Wallet className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                      Pilih dompet:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                      {walletsLoaded ? (
                                        wallets.map((wallet) => (
                                          <Button
                                            key={wallet}
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleWalletSelect(wallet, i)}
                                            className="text-xs h-8 sm:h-9 rounded-lg border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
                                          >
                                            {wallet}
                                          </Button>
                                        ))
                                      ) : (
                                        <div className="flex gap-1.5 sm:gap-2">
                                          <Skeleton className="h-8 sm:h-9 w-16 sm:w-20 rounded-lg" />
                                          <Skeleton className="h-8 sm:h-9 w-16 sm:w-20 rounded-lg" />
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                            
                            {msg.data?.status === 'lengkap' && allTransactionsHaveWallet(msg.data?.transaksi || []) && msg.transaction_status !== 'accepted' && msg.transaction_status !== 'rejected' && (
                              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSave(msg.data, i)}
                                  disabled={loading}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-9 sm:h-10 transition-all duration-200 text-xs sm:text-sm"
                                >
                                  {loading ? (
                                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                  )}
                                  {loading ? 'Menyimpan...' : `Simpan${msg.data?.transaksi?.length > 1 ? ` (${msg.data.transaksi.length} transaksi)` : ''}`}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleCancel(i)}
                                  disabled={loading}
                                  className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-xl h-9 sm:h-10 transition-all duration-200 text-xs sm:text-sm"
                                >
                                  <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                  Batal
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className={`flex items-center justify-between mt-2 sm:mt-3 ${
                          msg.role === 'user' 
                            ? 'text-white/70' 
                            : msg.transaction_status === 'accepted'
                            ? 'text-green-600'
                            : msg.transaction_status === 'rejected'
                            ? 'text-red-600'
                            : 'text-gray-400'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] sm:text-xs">
                              {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(getMessageText(msg), msg.id)}
                            className={`opacity-50 hover:opacity-100 transition-opacity p-1 rounded ${
                              msg.role === 'user' 
                                ? 'hover:bg-white/20' 
                                : msg.transaction_status === 'accepted'
                                ? 'hover:bg-green-100'
                                : msg.transaction_status === 'rejected'
                                ? 'hover:bg-red-100'
                                : 'hover:bg-gray-100'
                            }`}
                            title="Salin"
                          >
                            {copiedId === msg.id ? (
                              <Check className={`h-3 w-3 ${
                                msg.role === 'user' 
                                  ? 'text-white/70' 
                                  : msg.transaction_status === 'accepted'
                                  ? 'text-green-600'
                                  : msg.transaction_status === 'rejected'
                                  ? 'text-red-600'
                                  : 'text-gray-400'
                              }`} />
                            ) : (
                              <Copy className={`h-3 w-3 ${
                                msg.role === 'user' 
                                  ? 'text-white/70' 
                                  : msg.transaction_status === 'accepted'
                                  ? 'text-green-600'
                                  : msg.transaction_status === 'rejected'
                                  ? 'text-red-600'
                                  : 'text-gray-400'
                              }`} />
                            )}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-gray-100 bg-white p-3 sm:p-4 md:p-6 safe-area-bottom">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-gray-400">
              {messages.length > 0 && `${messages.length} pesan`}
            </div>
            {messages.length > 0 && userRole === 'admin' && (
              <Button 
                type="button"
                size="sm"
                variant="ghost"
                onClick={clearChatHistory}
                className="h-8 px-3 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 text-xs gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus Pesan
              </Button>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3 items-end bg-white rounded-2xl border border-gray-200 shadow-subtle p-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, window.innerHeight * 0.2) + 'px'
              }}
              placeholder="Tulis pesan/transaksi..."
              className="flex-1 resize-none min-h-[48px] sm:min-h-[56px] max-h-[20vh] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-700 placeholder:text-gray-400 py-2.5 sm:py-3 px-2 sm:px-3 text-sm sm:text-base"
              rows={1}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={loading || !input.trim()}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 self-center"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
      <ConfirmDialog />
    </div>
  )
}