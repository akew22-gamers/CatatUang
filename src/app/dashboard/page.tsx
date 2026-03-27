'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, TrendingUp, TrendingDown, Wallet, CheckCircle2, XCircle, AlertCircle, Loader2, Trash2, DollarSign, Copy, Check } from 'lucide-react'
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
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [wallets, setWallets] = useState<string[]>([])
  const [walletsLoaded, setWalletsLoaded] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    initialize()
  }, [])

  const initialize = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      setUserId(user.id)
      await Promise.all([
        loadWallets(),
        loadChatHistory(user.id)
      ])
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

  const loadChatHistory = async (uid: string) => {
    const supabase = createClient()
    
    try {
      const { data, error } = await (supabase as any)
        .from('chat_messages')
        .select('*')
        .eq('user_id', uid)
        .eq('group_id', 1)
        .order('created_at', { ascending: true })
        .limit(100)
      
      if (error) {
        console.error('Error loading chat history:', error)
      } else if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.role === 'user' ? msg.content : renderAssistantContent(msg.data || { pesan_balasan: msg.content }),
          data: msg.data,
          timestamp: new Date(msg.created_at)
        }))
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
    
    try {
      const { data: savedData, error } = await (supabase as any)
        .from('chat_messages')
        .insert({
          user_id: userId,
          group_id: 1,
          role,
          content,
          data: data || null
        })
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

  const renderAssistantContent = (parsed: any, messageIndex?: number) => {
    if (parsed.status === 'saved') {
      return (
        <div className="flex items-center gap-2 sm:gap-3 text-green-600">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <span className="font-semibold text-sm sm:text-base">Transaksi berhasil disimpan!</span>
        </div>
      )
    }
    
    if (parsed.status === 'cancelled') {
      return (
        <div className="flex items-center gap-2 sm:gap-3 text-gray-500">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <span className="text-sm sm:text-base">Transaksi dibatalkan.</span>
        </div>
      )
    }
    
    if (parsed.status === 'error') {
      return (
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
      return (
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
      const tx = parsed.transaksi?.[0]
      if (!tx) return parsed.pesan_balasan || ''
      
      return (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 sm:gap-3 text-green-600">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span className="font-semibold text-gray-900 text-sm sm:text-base">Transaksi Siap Disimpan</span>
          </div>
          <div className="grid gap-2 sm:gap-3 text-sm bg-gray-50/50 rounded-xl p-3 sm:p-4">
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
              <span className="font-medium text-gray-900 text-xs sm:text-sm">{tx.dompet || 'Belum dipilih'}</span>
            </div>
          </div>
        </div>
      )
    }
    
    if (parsed.status === 'kurang_data') {
      const tx = parsed.transaksi?.[0]
      
      return (
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
          {tx && (
            <div className="grid gap-2 sm:gap-3 text-sm bg-gray-50/50 rounded-xl p-3 sm:p-4">
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
                <span className="font-medium text-amber-600 text-xs sm:text-sm">Belum dipilih</span>
              </div>
            </div>
          )}
        </div>
      )
    }
    
    if (parsed.status === 'ambigu') {
      return (
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
    
    return (
      <div className="text-xs sm:text-sm text-gray-700 leading-relaxed">
        {parsed.pesan_balasan || ''}
      </div>
    )
  }

  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <p key={i} className="min-h-[1.5rem] leading-relaxed">
        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
          }
          return part
        })}
      </p>
    ))
  }

  const updateMessageStatus = async (messageIndex: number, newStatus: 'saved' | 'cancelled') => {
    let messageIdToUpdate: number | undefined
    
    setMessages(prev => {
      const newMessages = [...prev]
      const msg = newMessages[messageIndex]
      if (msg) {
        const updatedData = { ...msg.data, status: newStatus }
        msg.content = renderAssistantContent(updatedData)
        msg.data = updatedData
        messageIdToUpdate = msg.id
      }
      return newMessages
    })
    
    if (messageIdToUpdate) {
      const supabase = createClient()
      try {
        await (supabase as any)
          .from('chat_messages')
          .update({ data: { status: newStatus } })
          .eq('id', messageIdToUpdate)
      } catch (error) {
        console.error('Error updating message in database:', error)
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

      await updateMessageStatus(messageIndex, 'saved')
      toast.success('Transaksi berhasil disimpan!')
    } catch (error: any) {
      console.error('Save error:', error)
      
      await updateMessageStatus(messageIndex, 'cancelled')
      
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
    await updateMessageStatus(messageIndex, 'cancelled')
    toast.info('Transaksi dibatalkan')
  }

  const handleWalletSelect = async (walletName: string, messageIndex: number) => {
    const supabase = createClient()
    
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
      description: "Apakah Anda yakin ingin menghapus semua riwayat chat?",
      confirmText: "Hapus",
      cancelText: "Batal"
    })
    
    if (!confirmed) return
    
    const supabase = createClient()
    
    try {
      const { error } = await (supabase as any)
        .from('chat_messages')
        .delete()
        .eq('user_id', userId)
        .eq('group_id', 1)
      
      if (error) {
        console.error('Error clearing chat:', error)
        toast.error('Gagal menghapus riwayat chat')
      } else {
        setMessages([])
        toast.success('Riwayat chat berhasil dihapus')
      }
    } catch (error) {
      console.error('Failed to clear chat:', error)
      toast.error('Gagal menghapus riwayat chat')
    }
  }

  const containsAmount = (text: string): boolean => {
    const amountPatterns = [
      /\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/,
      /\d+(?:rb|ribu|juta|jt|k)/i,
      /\d+\s*(?:rb|ribu|juta|jt|k)/i,
    ]
    return amountPatterns.some(pattern => pattern.test(text))
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
    
    const userMsg: Message = {
      role: 'user',
      content: combinedMessage,
      timestamp: new Date()
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
          content: renderAssistantContent(errorData),
          data: errorData,
          timestamp: new Date(),
        }
        const msgId = await saveMessage('assistant', result.error, errorData)
        if (msgId) errorMsg.id = msgId
        setMessages(prev => [...prev, errorMsg])
        return
      }

      const parsed = result.data
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: renderAssistantContent(parsed),
        data: parsed,
        timestamp: new Date()
      }
      
      const msgId = await saveMessage('assistant', parsed.pesan_balasan || '', parsed)
      if (msgId) assistantMsg.id = msgId
      setMessages(prev => [...prev, assistantMsg])
    } catch (error: any) {
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
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    
    if (looksLikeTransaction(userMessage) && !containsAmount(userMessage)) {
      const userMsg: Message = {
        role: 'user',
        content: userMessage,
        timestamp: new Date()
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
        content: renderAssistantContent(needAmountData),
        data: needAmountData,
        timestamp: new Date()
      }
      
      const msgId = await saveMessage('assistant', needAmountData.pesan_balasan, needAmountData)
      if (msgId) assistantMsg.id = msgId
      setMessages(prev => [...prev, assistantMsg])
      return
    }
    
    setLoading(true)
    
    const userMsg: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
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
          content: renderAssistantContent(errorData),
          data: errorData,
          timestamp: new Date(),
        }
        const msgId = await saveMessage('assistant', result.error, errorData)
        if (msgId) errorMsg.id = msgId
        setMessages(prev => [...prev, errorMsg])
        return
      }

      const parsed = result.data
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: renderAssistantContent(parsed),
        data: parsed,
        timestamp: new Date()
      }
      
      const msgId = await saveMessage('assistant', parsed.pesan_balasan || '', parsed)
      if (msgId) assistantMsg.id = msgId
      setMessages(prev => [...prev, assistantMsg])
    } catch (error: any) {
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
      return msg.content as string
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
    
    const tx = msg.data?.transaksi?.[0]
    if (tx) {
      return `Jenis: ${tx.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}\nJumlah: Rp ${tx.nominal?.toLocaleString('id-ID')}\nKeterangan: ${tx.keterangan}\nDompet: ${tx.dompet || 'Belum dipilih'}`
    }
    
    return msg.data?.pesan_balasan || ''
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
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
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2 sm:mr-3 mt-1 flex-shrink-0 shadow-md">
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col max-w-[90%] sm:max-w-[85%] md:max-w-[75%]">
                    <Card className={`shadow-subtle border-0 ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md' 
                        : 'bg-white rounded-2xl rounded-bl-md'
                    }`}>
                      <CardContent className={`p-3 sm:p-4 ${msg.role === 'user' ? 'pb-1 sm:pb-2' : ''}`}>
                        {msg.role === 'user' ? (
                          <p className="leading-relaxed text-sm sm:text-base">{msg.content as string}</p>
                        ) : (
                          <div className="space-y-3 sm:space-y-4">
                            {msg.content}
                            
                            {msg.data?.transaksi?.[0] && !msg.data.transaksi[0].dompet && msg.data?.status !== 'saved' && msg.data?.status !== 'cancelled' && msg.data?.status !== 'error' && (
                              <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-gray-100">
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
                                      <Skeleton className="h-8 sm:h-9 w-16 sm:w-20 rounded-lg" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {msg.data?.status === 'lengkap' && msg.data?.transaksi?.[0]?.dompet && (
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
                                  {loading ? 'Menyimpan...' : 'Simpan'}
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
                        
                        <div className={`flex items-center justify-between mt-2 sm:mt-3 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] sm:text-xs">
                              {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(getMessageText(msg), msg.id)}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 ${msg.role === 'user' ? 'hover:bg-white/20' : 'hover:bg-gray-100'}`}
                            title="Salin"
                          >
                            {copiedId === msg.id ? (
                              <Check className={`h-3 w-3 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-400'}`} />
                            ) : (
                              <Copy className={`h-3 w-3 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-400'}`} />
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
          <div className="flex gap-2 sm:gap-3 items-end bg-white rounded-2xl border border-gray-200 shadow-subtle p-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pesan/transaksi..."
              className="flex-1 resize-none min-h-[48px] sm:min-h-[56px] max-h-[120px] sm:max-h-[200px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-700 placeholder:text-gray-400 py-2.5 sm:py-3 px-2 sm:px-3 text-sm sm:text-base"
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
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
            {messages.length > 0 && (
              <Button 
                type="button"
                size="icon"
                variant="ghost"
                onClick={clearChatHistory}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
          </div>
        </form>
      </div>
      <ConfirmDialog />
    </div>
  )
}