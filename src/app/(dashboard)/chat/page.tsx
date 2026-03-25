'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

interface Message {
  role: 'user' | 'assistant'
  content: string
  data?: any
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
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
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${result.error}` }])
        return
      }

      const parsed = result.data

      // Create confirmation message
      let confirmationText = `✅ **Konfirmasi Transaksi**\n\n`
      confirmationText += `Type: ${parsed.type}\n`
      confirmationText += `Amount: ${parsed.amount ? `Rp ${parsed.amount.toLocaleString('id-ID')}` : '❓'}\n`
      confirmationText += `Description: ${parsed.description}\n`
      confirmationText += `Category: ${parsed.category || 'Umum'}\n`
      confirmationText += `Wallet: ${parsed.wallet || 'Cash'}\n\n`

      if (parsed.clarification_needed) {
        confirmationText += `⚠️ Saya kurang yakin. Mohon konfirmasi detail transaksi.`
      } else {
        confirmationText += `Klik tombol di bawah untuk menyimpan.`
      }

      setMessages(prev => [...prev, { role: 'assistant', content: confirmationText, data: parsed }])

      // Create confirmation record
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // TODO: Get user's group_id
        await fetch('/api/confirmations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            group_id: 'TODO_GROUP_ID',
            original_message: userMessage,
            parsed_data: parsed,
          }),
        })
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-20">
            <h2 className="text-2xl font-bold mb-2">CatatUang AI Assistant</h2>
            <p>Catat transaksi dengan bahasa natural</p>
            <p className="text-sm mt-2">Contoh: "Beli makan siang 50rb pakai gopay"</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <Card key={i} className={`max-w-2xl ${msg.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : ''}`}>
            <CardContent className="p-4">
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.data && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm">✅ Simpan</Button>
                  <Button size="sm" variant="outline">❌ Batal</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik transaksi..."
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? '...' : 'Kirim'}
        </Button>
      </form>
    </div>
  )
}
