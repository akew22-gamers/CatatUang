import { Bot } from 'grammy'
import { createClient } from '@supabase/supabase-js'

const token = process.env.TELEGRAM_BOT_TOKEN
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!token) {
  console.error('CRITICAL: TELEGRAM_BOT_TOKEN is not set!')
}

export const bot = new Bot(token || 'DUMMY', {
  botInfo: {
    id: 8619042101,
    is_bot: true,
    first_name: 'CatatUang Bot',
    username: 'CatatUangBot',
    can_join_groups: true,
    can_read_all_group_messages: false,
    supports_inline_queries: false,
  },
})

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

console.log('Supabase client initialized:', !!supabase)

export function setupBotHandlers() {
  if (!token) {
    console.error('Cannot setup handlers: TELEGRAM_BOT_TOKEN missing')
    return
  }

  console.log('Setting up Telegram bot handlers...')

  bot.command('start', async (ctx) => {
    console.log('Start command from:', ctx.from?.id)
    
    await ctx.reply(
      `👋 *Halo! Saya CatatUang Bot*\n\n` +
      `Saya asisten AI untuk mencatat keuangan.\n\n` +
      `*Cara Pakai:*\n` +
      `1. Ketik: "Beli makan 50rb pakai gopay"\n` +
      `2. AI parse & konfirmasi\n` +
      `3. Klik "Simpan"\n\n` +
      `*Commands:*\n` +
      `/start - Mulai\n` +
      `/help - Bantuan\n`,
      { parse_mode: 'Markdown' }
    )
  })

  bot.command('help', async (ctx) => {
    console.log('Help command from:', ctx.from?.id)
    
    await ctx.reply(
      `📖 *Bantuan*\n\n` +
      `*Contoh input:*\n` +
      `- "Beli kopi 25rb"\n` +
      `- "Gaji 15 juta"\n` +
      `- "Transfer 500k BCA ke GoPay"\n\n` +
      `*Tips:*\n` +
      `- Bahasa Indonesia santai\n` +
      `- Sebut nominal (50rb, 100k)\n` +
      `- Sebut dompet (gopay, bca)\n`,
      { parse_mode: 'Markdown' }
    )
  })

  bot.on('message:text', async (ctx) => {
    const message = ctx.message.text
    console.log('Message from:', ctx.from?.id, 'Text:', message)

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://catatuang-three.vercel.app'
      
      const response = await fetch(`${appUrl}/api/parse-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      const result = await response.json()

      if (result.error) {
        await ctx.reply(`❌ Error: ${result.error}`)
        return
      }

      const parsed = result.data
      const amount = parsed.amount ? `Rp ${parsed.amount.toLocaleString('id-ID')}` : '❓'
      
      // Generate short ID
      const txId = Math.random().toString(36).substring(2, 8)
      
      // Store in Supabase
      if (supabase) {
        const { error } = await supabase
          .from('ai_confirmations')
          .insert({
            user_id: ctx.from?.id.toString(),
            group_id: 1, // TODO: Get user's group
            original_message: message,
            parsed_data: parsed,
            status: 'pending',
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          })
        
        if (error) {
          console.error('Failed to save confirmation:', error)
        } else {
          console.log('Confirmation saved to DB with txId:', txId)
        }
      }

      const confirmationText = 
        `✅ *Konfirmasi*\n\n` +
        `*Type:* ${parsed.type}\n` +
        `*Amount:* ${amount}\n` +
        `*Desc:* ${parsed.description}\n` +
        `*Category:* ${parsed.category || 'Umum'}\n` +
        `*Wallet:* ${parsed.wallet || 'Cash'}`

      await ctx.reply(confirmationText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Simpan', callback_data: `save_${txId}` },
            { text: '❌ Batal', callback_data: `cancel_${txId}` },
          ]],
        },
      })
      console.log('Confirmation sent with txId:', txId)
    } catch (error: any) {
      console.error('Message error:', error)
      await ctx.reply('❌ Terjadi kesalahan')
    }
  })

  bot.on('callback_query:data', async (ctx) => {
    const [action, txId] = ctx.callbackQuery.data.split('_')
    console.log('Callback:', action, txId, 'from:', ctx.from?.id)

    if (!supabase) {
      await ctx.answerCallbackQuery({ 
        show_alert: true, 
        text: 'Database not configured' 
      })
      return
    }

    // Find pending confirmation by user_id and recent
    const userId = ctx.from?.id.toString()
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: confirmations, error: fetchError } = await supabase
      .from('ai_confirmations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gt('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !confirmations) {
      console.error('Confirmation not found:', fetchError)
      await ctx.answerCallbackQuery({ 
        show_alert: true, 
        text: 'Transaksi sudah expired atau tidak ditemukan' 
      })
      return
    }

    if (action === 'cancel') {
      await supabase
        .from('ai_confirmations')
        .update({ status: 'rejected' })
        .eq('id', confirmations.id)
      
      await ctx.answerCallbackQuery()
      await ctx.editMessageText('❌ Transaksi dibatalkan')
      console.log('Transaction cancelled:', confirmations.id)
      return
    }

    if (action === 'save') {
      try {
        const parsed = confirmations.parsed_data
        
        // TODO: Create actual transaction in database
        // For now, just update confirmation status
        await supabase
          .from('ai_confirmations')
          .update({ status: 'confirmed' })
          .eq('id', confirmations.id)
        
        console.log('Transaction saved:', parsed)
        
        await ctx.answerCallbackQuery()
        await ctx.editMessageText('✅ Transaksi berhasil disimpan!\n\n_Note: DB integration akan disusukan_')
      } catch (error: any) {
        console.error('Save error:', error)
        await ctx.answerCallbackQuery({ show_alert: true })
        await ctx.editMessageText('❌ Error saat menyimpan')
      }
    }
  })

  bot.catch((err) => console.error('Bot error:', err))
  console.log('Bot handlers setup complete!')
}
