'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
  role: 'user' | 'assistant'
  content: string
  data?: any
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      const result = await response.json()

      if (result.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${result.error}` }])
        return
      }

      const parsed = result.data
      
      let botMessage = ''
      if (parsed.status === 'lengkap') {
        botMessage = `✅ **Transaksi Siap Disimpan**\n\n`
        botMessage += `**Jenis:** ${parsed.transaksi[0].jenis === 'income' ? 'Pemasukan' : 'Pengeluaran'}\n`
        botMessage += `**Jumlah:** Rp ${parsed.transaksi[0].nominal?.toLocaleString('id-ID')}\n`
        botMessage += `**Keterangan:** ${parsed.transaksi[0].keterangan}\n`
        botMessage += `**Kategori:** ${parsed.transaksi[0].kategori}\n`
        botMessage += `**Dompet:** ${parsed.transaksi[0].dompet}\n\n`
        botMessage += `Klik tombol di bawah untuk menyimpan.`
      } else if (parsed.status === 'kurang_data') {
        botMessage = `⚠️ **Data Belum Lengkap**\n\n${parsed.pesan_balasan}`
      } else {
        botMessage = parsed.pesan_balasan
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: botMessage,
        data: parsed
      }])
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${error.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-2">💬 CatatUang AI Assistant</h2>
                <p className="text-muted-foreground mb-4">
                  Catat transaksi dengan bahasa natural
                </p>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Contoh:</strong></p>
                  <p>• "Beli makan siang 50rb pakai gopay"</p>
                  <p>• "Gaji masuk 15 juta ke BCA"</p>
                  <p>• "Transfer 500k dari BCA ke GoPay"</p>
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-2xl p-4 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </Card>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik transaksi (contoh: Beli kopi 25rb dari GoPay)..."
            className="flex-1 resize-none"
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
            className="px-6"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
