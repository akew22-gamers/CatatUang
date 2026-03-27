'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, TrendingUp, TrendingDown, Wallet, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'

interface Message {
  role: 'user' | 'assistant'
  content: string | React.ReactNode
  data?: any
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [wallets, setWallets] = useState<string[]>(['Cash', 'BCA', 'GoPay'])
  const [walletsLoaded, setWalletsLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    loadWallets()
  }, [])
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadWallets = async () => {
    const supabase = createClient()
    
    const { data: walletData, error } = await supabase
      .from('wallets')
      .select('name')
      .eq('group_id', 1)
      .order('name')
    
    if (!error && walletData && walletData.length > 0) {
      const walletNames = walletData.map(w => w.name)
      setWallets(walletNames)
    }
    setWalletsLoaded(true)
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

  const updateMessageStatus = (messageIndex: number, newStatus: 'saved' | 'cancelled') => {
    setMessages(prev => {
      const newMessages = [...prev]
      const msg = newMessages[messageIndex]
      if (msg) {
        if (newStatus === 'saved') {
          msg.content = (
            <div className="flex items-center gap-2 sm:gap-3 text-green-600">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="font-semibold text-sm sm:text-base">Transaksi berhasil disimpan!</span>
            </div>
          )
        } else {
          msg.content = (
            <div className="flex items-center gap-2 sm:gap-3 text-gray-500">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="text-sm sm:text-base">Transaksi dibatalkan. Silakan ketik transaksi baru.</span>
            </div>
          )
        }
        msg.data = undefined
      }
      return newMessages
    })
  }

  const handleSave = async (data: any, messageIndex: number) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const response = await fetch('/api/confirmations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || 'anonymous',
          group_id: 1,
          original_message: messages[messageIndex - 1]?.content as string,
          parsed_data: data,
        }),
      })

      const result = await response.json()
      if (result.error) throw new Error(result.error)

      updateMessageStatus(messageIndex, 'saved')
    } catch (error: any) {
      console.error('Save error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: (
          <div className="flex items-center gap-2 sm:gap-3 text-red-600">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span className="font-medium text-sm sm:text-base">Error: {error.message}</span>
          </div>
        ),
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = (messageIndex: number) => {
    updateMessageStatus(messageIndex, 'cancelled')
  }

  const handleWalletSelect = (walletName: string, messageIndex: number) => {
    setMessages(prev => {
      const newMessages = [...prev]
      const msg = newMessages[messageIndex]
      if (msg && msg.data) {
        for (const tx of msg.data.transaksi) {
          tx.dompet = walletName
        }
        msg.data.status = 'lengkap'
      }
      return newMessages
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date()
    }])

    try {
      const response = await fetch('/api/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      const result = await response.json()

      if (result.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: (
            <div className="flex items-center gap-2 sm:gap-3 text-red-600">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="font-medium text-sm sm:text-base">Error: {result.error}</span>
            </div>
          ),
          timestamp: new Date()
        }])
        return
      }

      const parsed = result.data
      
      let content: React.ReactNode = null
      
      if (parsed.status === 'lengkap') {
        const tx = parsed.transaksi[0]
        content = (
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
      } else if (parsed.status === 'kurang_data') {
        const tx = parsed.transaksi[0]
        content = (
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
      } else if (parsed.status === 'ambigu') {
        content = (
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
      } else {
        content = (
          <div className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            {formatText(parsed.pesan_balasan)}
          </div>
        )
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content,
        data: parsed,
        timestamp: new Date()
      }])
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: (
          <div className="flex items-center gap-2 sm:gap-3 text-red-600">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span className="font-medium text-sm sm:text-base">Error: {error.message}</span>
          </div>
        ),
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] sm:h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <ScrollArea className="flex-1">
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[70vh] text-center space-y-4 sm:space-y-6 px-4">
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
          )}
          
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2 sm:mr-3 mt-1 flex-shrink-0 shadow-md">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
              )}
              <Card className={`max-w-[90%] sm:max-w-[85%] md:max-w-[75%] shadow-subtle border-0 ${
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
                      
                      {msg.data?.transaksi?.[0] && !msg.data.transaksi[0].dompet && (
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
                  
                  <div className={`text-[10px] sm:text-xs mt-2 sm:mt-3 ${msg.role === 'user' ? 'text-white/70 text-right' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-gray-100 bg-white/80 backdrop-blur p-3 sm:p-4 md:p-6 safe-area-bottom">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative flex gap-2 sm:gap-3 items-end bg-white rounded-2xl border border-gray-200 shadow-subtle hover:shadow-elevated transition-shadow duration-200 p-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik transaksi (contoh: Beli kopi 25rb dari GoPay)..."
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
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400 text-center mt-2 sm:mt-3">
            Tekan Enter untuk mengirim, Shift + Enter untuk baris baru
          </p>
        </form>
      </div>
    </div>
  )
}
