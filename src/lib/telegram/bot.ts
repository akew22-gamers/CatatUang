import { Bot } from 'grammy'

const token = process.env.TELEGRAM_BOT_TOKEN

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

// Temporary storage for pending transactions (in production, use Redis/DB)
const pendingTransactions = new Map<string, any>()

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
      
      // Generate short ID for this transaction
      const txId = Math.random().toString(36).substring(2, 8)
      pendingTransactions.set(txId, { ...parsed, userId: ctx.from?.id })
      
      // Clean up old transactions after 5 minutes
      setTimeout(() => pendingTransactions.delete(txId), 5 * 60 * 1000)

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

    const transaction = pendingTransactions.get(txId)

    if (!transaction) {
      await ctx.answerCallbackQuery({ 
        show_alert: true, 
        text: 'Transaksi sudah expired atau tidak ditemukan' 
      })
      return
    }

    if (action === 'cancel') {
      pendingTransactions.delete(txId)
      await ctx.answerCallbackQuery()
      await ctx.editMessageText('❌ Transaksi dibatalkan')
      console.log('Transaction cancelled:', txId)
      return
    }

    if (action === 'save') {
      try {
        // TODO: Save to database
        console.log('Transaction saved:', transaction)
        
        pendingTransactions.delete(txId)
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
