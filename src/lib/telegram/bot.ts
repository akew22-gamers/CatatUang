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
      `Saya asisten AI untuk mencatat keuangan Anda dengan mudah.\n\n` +
      `*Cara Pakai:*\n` +
      `1. Ketik transaksi: "Beli makan siang 50rb pakai gopay"\n` +
      `2. Saya akan parse dan konfirmasi\n` +
      `3. Klik "Simpan" untuk menyimpan\n\n` +
      `*Commands Tersedia:*\n` +
      `/start - Mulai bot\n` +
      `/help - Bantuan\n` +
      `/hari_ini - Laporan hari ini\n` +
      `/bulan_ini - Laporan bulan ini\n\n` +
      `Ayo mulai catat keuangan Anda! 💰`,
      { parse_mode: 'Markdown' }
    )
  })

  bot.command('help', async (ctx) => {
    console.log('Help command from:', ctx.from?.id)
    
    await ctx.reply(
      `📖 *Bantuan CatatUang*\n\n` +
      `*Input Transaksi:*\n` +
      `Kirim pesan dengan format natural:\n` +
      `- "Beli kopi 25rb"\n` +
      `- "Gaji masuk 15 juta"\n` +
      `- "Transfer 500k dari BCA ke GoPay"\n\n` +
      `*Commands:*\n` +
      `/start - Mulai bot\n` +
      `/help - Tampilkan bantuan ini\n` +
      `/hari_ini - Ringkasan hari ini\n` +
      `/minggu_ini - Ringkasan minggu ini\n` +
      `/bulan_ini - Ringkasan bulan ini\n` +
      `/export - Export laporan PDF/XLSX\n\n` +
      `*Tips:*\n` +
      `- Gunakan bahasa Indonesia santai\n` +
      `- Sebutkan nominal (50rb, 100k, 1jt)\n` +
      `- Sebutkan dompet (gopay, ovo, bca, cash)\n\n` +
      `Butuh bantuan lain? Hubungi @eascreative`,
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
      const txId = Math.random().toString(36).substring(2, 8)
      
      if (supabase) {
        const { error } = await supabase
          .from('ai_confirmations')
          .insert({
            user_id: ctx.from?.id.toString(),
            group_id: 1,
            original_message: message,
            parsed_data: parsed,
            status: 'pending',
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          })
        
        if (error) console.error('Failed to save confirmation:', error)
        else console.log('Confirmation saved with txId:', txId)
      }

      let confirmationText = `✅ *Konfirmasi Transaksi*\n\n`
      confirmationText += `*Jenis:* ${parsed.type === 'income' ? 'Pemasukan' : parsed.type === 'expense' ? 'Pengeluaran' : 'Transfer'}\n`
      confirmationText += `*Jumlah:* ${amount}\n`
      confirmationText += `*Keterangan:* ${parsed.description}\n`
      confirmationText += `*Kategori:* ${parsed.category || 'Umum'}\n`
      confirmationText += `*Dompet:* ${parsed.wallet || 'Cash'}\n\n`

      if (parsed.clarification_needed) {
        confirmationText += `⚠️ _Saya kurang yakin. Mohon konfirmasi detail transaksi._`
      }

      await ctx.reply(confirmationText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Simpan', callback_data: `save_${txId}` },
            { text: '❌ Batal', callback_data: `cancel_${txId}` },
          ]],
        },
      })
      console.log('Confirmation sent')
    } catch (error: any) {
      console.error('Message error:', error)
      await ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi.')
    }
  })

  bot.on('callback_query:data', async (ctx) => {
    const [action, txId] = ctx.callbackQuery.data.split('_')
    console.log('Callback:', action, txId, 'from:', ctx.from?.id)

    if (!supabase) {
      await ctx.answerCallbackQuery({ show_alert: true, text: 'Database belum dikonfigurasi' })
      return
    }

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
      await ctx.answerCallbackQuery({ show_alert: true, text: 'Transaksi sudah expired atau tidak ditemukan' })
      return
    }

    if (action === 'cancel') {
      await supabase.from('ai_confirmations').update({ status: 'rejected' }).eq('id', confirmations.id)
      await ctx.answerCallbackQuery()
      await ctx.editMessageText('❌ Transaksi dibatalkan')
      console.log('Transaction cancelled')
      return
    }

    if (action === 'save') {
      try {
        const parsed = confirmations.parsed_data
        const groupId = 1
        
        const { data: transaction, error: txError } = await supabase
          .from('transactions')
          .insert({
            type: parsed.type,
            amount: parsed.amount,
            description: parsed.description || confirmations.original_message,
            group_id: groupId,
            telegram_user_id: userId,
            transaction_date: new Date().toISOString(),
          })
          .select()
          .single()
        
        if (txError) throw txError
        
        await supabase.from('ai_confirmations').update({ status: 'confirmed' }).eq('id', confirmations.id)
        
        console.log('Transaction created:', transaction)
        await ctx.answerCallbackQuery()
        await ctx.editMessageText('✅ Transaksi berhasil disimpan!\n\nTransaksi sudah masuk ke database.')
      } catch (error: any) {
        console.error('Save error:', error)
        await ctx.answerCallbackQuery({ show_alert: true })
        await ctx.editMessageText('❌ Error saat menyimpan: ' + error.message)
      }
    }
  })

  bot.catch((err) => console.error('Bot error:', err))
  console.log('Bot handlers setup complete!')
}
