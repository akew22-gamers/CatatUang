import { Bot } from 'grammy'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables')
}

export const bot = new Bot(token)

// Bot configuration and handlers will be set up in the webhook handler
export function setupBotHandlers() {
  // Handle /start command
  bot.command('start', async (ctx) => {
    const welcomeMessage = `
👋 *Halo! Saya CatatUang Bot*

Saya asisten AI untuk mencatat keuangan Anda dengan mudah.

*Cara Pakai:*
1. Ketik transaksi: "Beli makan siang 50rb pakai gopay"
2. Saya akan parse dan konfirmasi
3. Klik "Simpan" untuk menyimpan

*Commands Tersedia:*
/start - Mulai bot
/help - Bantuan
/hari_ini - Laporan hari ini
/minggu_ini - Laporan minggu ini
/bulan_ini - Laporan bulan ini
/kategori - List kategori
/dompet - List dompet

Ayo mulai catat keuangan Anda! 💰
    `.trim()

    await ctx.reply(welcomeMessage, { parse_mode: 'Markdown' })
  })

  // Handle /help command
  bot.command('help', async (ctx) => {
    const helpMessage = `
📖 *Bantuan CatatUang*

*Input Transaksi:*
Kirim pesan dengan format natural:
- "Beli kopi 25rb"
- "Gaji masuk 15 juta"
- "Transfer 500k dari BCA ke GoPay"

*Commands:*
/start - Mulai bot
/help - Tampilkan bantuan ini
/hari_ini - Ringkasan hari ini
/minggu_ini - Ringkasan minggu ini
/bulan_ini - Ringkasan bulan ini
/export - Export laporan PDF/XLSX

*Tips:*
- Gunakan bahasa Indonesia santai
- Sebutkan nominal (50rb, 100k, 1jt)
- Sebutkan dompet (gopay, ovo, bca, cash)

Butuh bantuan lain? Hubungi @eascreative
    `.trim()

    await ctx.reply(helpMessage, { parse_mode: 'Markdown' })
  })

  // Handle text messages (for transaction parsing)
  bot.on('message:text', async (ctx) => {
    const message = ctx.message.text

    // Show typing indicator
    await ctx.sendChatAction('typing')

    try {
      // Call AI parser API
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/parse-transaction`, {
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

      // Format confirmation message
      let confirmationText = `✅ *Konfirmasi Transaksi*\n\n`
      confirmationText += `*Type:* ${parsed.type}\n`
      confirmationText += `*Amount:* ${parsed.amount ? `Rp ${parsed.amount.toLocaleString('id-ID')}` : '❓'}\n`
      confirmationText += `*Description:* ${parsed.description}\n`
      confirmationText += `*Category:* ${parsed.category || 'Umum'}\n`
      confirmationText += `*Wallet:* ${parsed.wallet || 'Cash'}\n\n`

      if (parsed.clarification_needed) {
        confirmationText += `⚠️ _Saya kurang yakin. Mohon konfirmasi detail transaksi._`
      }

      // Send confirmation with inline buttons
      await ctx.reply(confirmationText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Simpan', callback_data: `confirm_${Buffer.from(JSON.stringify(parsed)).toString('base64')}` },
              { text: '❌ Batal', callback_data: 'cancel' },
            ],
          ],
        },
      })
    } catch (error: any) {
      console.error('Telegram message error:', error)
      await ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi.')
    }
  })

  // Handle callback queries (button clicks)
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data

    if (data === 'cancel') {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText('❌ Transaksi dibatalkan.')
      return
    }

    if (data.startsWith('confirm_')) {
      try {
        const encodedData = data.replace('confirm_', '')
        const parsedData = JSON.parse(Buffer.from(encodedData, 'base64').toString())

        // Get user info
        const userId = ctx.from?.id.toString()
        if (!userId) {
          await ctx.answerCallbackQuery({ show_alert: true })
          await ctx.editMessageText('❌ User ID tidak ditemukan')
          return
        }

        // TODO: Create transaction in database
        // For now, just confirm
        await ctx.answerCallbackQuery()
        await ctx.editMessageText('✅ Transaksi berhasil disimpan!\n\n_Note: Database integration akan diimplementasi selanjutnya._')
      } catch (error: any) {
        console.error('Callback error:', error)
        await ctx.answerCallbackQuery({ show_alert: true })
        await ctx.editMessageText('❌ Terjadi kesalahan saat menyimpan transaksi')
      }
    }
  })

  // Error handling
  bot.catch(async (err) => {
    console.error('Bot error:', err)
  })
}
