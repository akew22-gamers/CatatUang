import { Bot } from 'grammy'

const token = process.env.TELEGRAM_BOT_TOKEN

if (!token) {
  console.error('CRITICAL: TELEGRAM_BOT_TOKEN is not set!')
}

export const bot = new Bot(token || 'DUMMY')

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

      await ctx.reply(
        `✅ *Konfirmasi*\n\n` +
        `*Type:* ${parsed.type}\n` +
        `*Amount:* ${amount}\n` +
        `*Desc:* ${parsed.description}\n` +
        `*Category:* ${parsed.category || 'Umum'}\n` +
        `*Wallet:* ${parsed.wallet || 'Cash'}\n`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Simpan', callback_data: `confirm_${Buffer.from(JSON.stringify(parsed)).toString('base64')}` },
              { text: '❌ Batal', callback_data: 'cancel' },
            ]],
          },
        }
      )
    } catch (error: any) {
      console.error('Message error:', error)
      await ctx.reply('❌ Terjadi kesalahan')
    }
  })

  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data
    console.log('Callback:', data, 'from:', ctx.from?.id)

    if (data === 'cancel') {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText('❌ Dibatalkan')
      return
    }

    if (data.startsWith('confirm_')) {
      try {
        await ctx.answerCallbackQuery()
        await ctx.editMessageText('✅ Tersimpan!\n\n_Note: DB integration akan disusukan_')
      } catch (error: any) {
        console.error('Callback error:', error)
        await ctx.answerCallbackQuery({ show_alert: true })
        await ctx.editMessageText('❌ Error')
      }
    }
  })

  bot.catch((err) => console.error('Bot error:', err))
  console.log('Bot handlers setup complete!')
}
