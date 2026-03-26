'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
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
  const [wallets, setWallets] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    loadWallets()
    scrollToBottom()
  }, [messages])

  const loadWallets = async () => {
    try {
      const { data } = await fetch('/api/auth/user').then(r => r.json())
      if (!data?.user) {
        console.log('No user found')
        return
      }
      
      const supabase = createClient()
      const { data: walletData, error } = await supabase
        .from('wallets')
        .select('name')
        .eq('group_id', 1)
        .order('name')
      
      if (error) {
        console.error('Error fetching wallets:', error)
        return
      }
      
      const walletNames = walletData?.map(w => w.name) || []
      console.log('Loaded wallets:', walletNames)
      setWallets(walletNames)
    } catch (error) {
      console.error('Error loading wallets:', error)
    }
  }

  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <p key={i} className="min-h-[1.5rem]">
        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
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
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Transaksi berhasil disimpan!</span>
            </div>
          )
        } else {
          msg.content = (
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="h-5 w-5" />
              <span>Transaksi dibatalkan. Silakan ketik transaksi baru.</span>
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
      const { data: { user } } = await fetch('/api/auth/user').then(r => r.json())
      
      const response = await fetch('/api/confirmations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || 'anonymous',
          group_id: 1,
          original_message: messages[messageIndex - 1]?.content,
          parsed_data: data,
        }),
      })

      const result = await response.json()
      if (result.error) throw new Error(result.error)

      updateMessageStatus(messageIndex, 'saved')
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span>❌ Error: {error.message}</span>
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
    
    const userMessageIndex = messages.length
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
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span>❌ Error: {result.error}</span>
            </div>
          ),
          timestamp: new Date()
        }])
        return
      }

      const parsed = result.data
      const messageIndex = messages.length + 1
      
      // Render message based on status
      let content: React.ReactNode = null
      let showButtons = false
      
      if (parsed.status === 'lengkap') {
        const tx = parsed.transaksi[0]
        content = (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Transaksi Siap Disimpan</span>
            </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jenis:</span>
                  <Badge variant={tx.jenis === 'pemasukan' ? 'default' : 'destructive'}>
                    {tx.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jumlah:</span>
                  <span className="font-semibold">Rp {tx.nominal?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Keterangan:</span>
                  <span>{tx.keterangan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dompet:</span>
                  <span>{tx.dompet || '❌ Belum dipilih'}</span>
                </div>
              </div>
          </div>
        )
        showButtons = true
      } else if (parsed.status === 'kurang_data') {
        const tx = parsed.transaksi[0]
        content = (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <span className="font-semibold">Data Belum Lengkap</span>
                <p className="text-sm mt-1">{parsed.pesan_balasan}</p>
              </div>
            </div>
            {tx && (
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jenis:</span>
                  <Badge variant={tx.jenis === 'pemasukan' ? 'default' : 'destructive'}>
                    {tx.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jumlah:</span>
                  <span className="font-semibold">Rp {tx.nominal?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Keterangan:</span>
                  <span>{tx.keterangan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dompet:</span>
                  <span>{tx.dompet || '❌ Belum dipilih'}</span>
                </div>
                {!tx.dompet && (
                  <div className="space-y-2 pt-2 border-t mt-2">
                    <p className="text-xs font-semibold text-muted-foreground">Pilih dompet:</p>
                    {wallets.length === 0 ? (
                      <p className="text-xs text-amber-600">⚠️ Belum ada dompet. Silakan tambah dompet di menu Pengaturan.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {wallets.map((wallet) => (
                          <Button
                            key={wallet}
                            size="sm"
                            variant="outline"
                            onClick={() => handleWalletSelect(wallet, messageIndex)}
                            className="text-xs h-8"
                          >
                            💳 {wallet}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      } else if (parsed.status === 'ambigu') {
        content = (
          <div className="flex items-start gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <span className="font-semibold">Data Ambigu</span>
              <p className="text-sm mt-1">{parsed.pesan_balasan}</p>
            </div>
          </div>
        )
      } else {
        content = (
          <div className="text-sm">
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
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span>❌ Error: {error.message}</span>
          </div>
        ),
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-background to-muted/20">
      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
              <div className="space-y-2">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  CatatUang AI Assistant
                </h2>
                <p className="text-muted-foreground text-lg">
                  Catat transaksi keuangan dengan bahasa natural
                </p>
              </div>
              
              <Card className="w-full max-w-md border-muted bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Contoh penggunaan:</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <span className="text-primary font-medium">💰</span>
                        <div>
                          <span className="text-muted-foreground">"Gaji masuk 15 juta ke BCA"</span>
                          <Badge className="ml-2 bg-green-600">Pemasukan</Badge>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <span className="text-primary font-medium">💳</span>
                        <div>
                          <span className="text-muted-foreground">"Beli makan siang 50rb pakai gopay"</span>
                          <Badge className="ml-2 bg-red-600">Pengeluaran</Badge>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <span className="text-primary font-medium">🔄</span>
                        <div>
                          <span className="text-muted-foreground">"Transfer 500k dari BCA ke GoPay"</span>
                          <Badge className="ml-2 bg-blue-600">Transfer</Badge>
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
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <Card className={`max-w-2xl shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-card border-muted'
              }`}>
                <CardContent className="p-4 space-y-3">
                  {msg.content}
                  
                  {/* Action Buttons */}
                  {msg.data?.status === 'lengkap' && (
                    <div className="flex gap-2 pt-3 border-t">
                      <Button 
                        size="sm" 
                        onClick={() => handleSave(msg.data, i)}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {loading ? 'Menyimpan...' : 'Simpan'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCancel(i)}
                        disabled={loading}
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Batal
                      </Button>
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  <div className={`text-xs ${msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik transaksi (contoh: Beli kopi 25rb dari GoPay)..."
            className="flex-1 resize-none min-h-[60px] focus:ring-2 focus:ring-primary/20"
            rows={2}
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
            size="lg"
            disabled={loading || !input.trim()}
            className="px-8 h-[60px] shadow-lg hover:shadow-xl transition-shadow"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
