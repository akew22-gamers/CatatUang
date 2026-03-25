import { Bot } from 'grammy'
import { createClient } from '@supabase/supabase-js'

const token = process.env.TELEGRAM_BOT_TOKEN
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!token) console.error('CRITICAL: TELEGRAM_BOT_TOKEN is not set!')

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
      `*Commands:*\n` +
      `/start - Mulai\n` +
      `/help - Bantuan\n` +
      `/kategori - Lihat kategori\n` +
      `/dompet - Lihat dompet\n\n` +
      `Ayo mulai catat keuangan! 💰`,
      { parse_mode: 'Markdown' }
    )
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(
      `📖 *Bantuan*\n\n` +
      `*Contoh input:*\n` +
      `- "Beli kopi 25rb"\n` +
      `- "Gaji 15 juta"\n` +
      `- "Transfer 500k BCA ke GoPay"\n\n` +
      `*Tips:*\n` +
      `- Bahasa Indonesia santai\n` +
      `- Sebut nominal & dompet\n`,
      { parse_mode: 'Markdown' }
    )
  })

  bot.command('kategori', async (ctx) => {
    if (!supabase) return ctx.reply('❌ Database tidak terkoneksi')
    
    const { data } = await supabase
      .from('categories')
      .select('name')
      .eq('group_id', 1)
      .order('name')
    
    if (!data?.length) return ctx.reply('📭 Belum ada kategori')
    
    const list = data.map(c => `• ${c.name}`).join('\n')
    await ctx.reply(`📋 *Kategori Tersedia:*\n\n${list}`, { parse_mode: 'Markdown' })
  })

  bot.command('dompet', async (ctx) => {
    if (!supabase) return ctx.reply('❌ Database tidak terkoneksi')
    
    const { data } = await supabase
      .from('wallets')
      .select('name')
      .eq('group_id', 1)
      .order('name')
    
    if (!data?.length) return ctx.reply('📭 Belum ada dompet')
    
    const list = data.map(w => `• ${w.name}`).join('\n')
    await ctx.reply(`💳 *Dompet Tersedia:*\n\n${list}`, { parse_mode: 'Markdown' })
  })

  bot.on('message:text', async (ctx) => {
    const message = ctx.message.text
    const userId = ctx.from?.id.toString()
    console.log('Message from:', userId, 'Text:', message)

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://catatuang-three.vercel.app'
      
      const response = await fetch(`${appUrl}/api/parse-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, group_id: 1 }),
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
        await supabase
          .from('ai_confirmations')
          .insert({
            user_id: userId,
            group_id: 1,
            original_message: message,
            parsed_data: parsed,
            status: 'pending',
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          })
        console.log('Confirmation saved with txId:', txId)
      }

      let confirmationText = `✅ *Konfirmasi Transaksi*\n\n`
      confirmationText += `*Jenis:* ${parsed.type === 'income' ? 'Pemasukan' : parsed.type === 'expense' ? 'Pengeluaran' : 'Transfer'}\n`
      confirmationText += `*Jumlah:* ${amount}\n`
      confirmationText += `*Keterangan:* ${parsed.description}\n`
      confirmationText += `*Kategori:* ${parsed.category || 'Umum'}\n`
      confirmationText += `*Dompet:* ${parsed.wallet || 'Belum dipilih'}\n`

      if (parsed.suggested_categories && parsed.suggested_categories.length > 0) {
        confirmationText += `\n⚠️ *Kategori baru:* ${parsed.suggested_categories.join(', ')}\n_Apakah Anda ingin menambahkan kategori ini?_\n`
      }

      if (parsed.clarification_needed && parsed.suggested_wallets) {
        confirmationText += `\n⚠️ *Pilih Dompet:*\n`
      }

      const keyboard: any[][] = [[
        { text: '✅ Simpan', callback_data: `save_${txId}` },
        { text: '❌ Batal', callback_data: `cancel_${txId}` },
      ]]

      if (parsed.suggested_wallets && parsed.suggested_wallets.length > 0) {
        for (const wallet of parsed.suggested_wallets) {
          keyboard.push([{ text: `💳 ${wallet}`, callback_data: `wallet_${txId}_${wallet}` }])
        }
      }

      await ctx.reply(confirmationText, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard },
      })
      console.log('Confirmation sent')
    } catch (error: any) {
      console.error('Message error:', error)
      await ctx.reply('❌ Terjadi kesalahan')
    }
  })

  bot.on('callback_query:data', async (ctx) => {
    const parts = ctx.callbackQuery.data.split('_')
    const action = parts[0]
    const txId = parts[1]
    const selectedWallet = parts[2]
    
    console.log('Callback:', action, txId, 'from:', ctx.from?.id)

    if (!supabase) {
      await ctx.answerCallbackQuery({ show_alert: true, text: 'Database error' })
      return
    }

    const userId = ctx.from?.id.toString()
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: confirmation, error: fetchError } = await supabase
      .from('ai_confirmations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gt('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !confirmation) {
      await ctx.answerCallbackQuery({ show_alert: true, text: 'Transaksi expired' })
      return
    }

    if (action === 'cancel') {
      await supabase.from('ai_confirmations').update({ status: 'rejected' }).eq('id', confirmation.id)
      await ctx.answerCallbackQuery()
      await ctx.editMessageText('❌ Transaksi dibatalkan')
      return
    }

    if (action === 'wallet') {
      const parsed = confirmation.parsed_data as any
      parsed.wallet = selectedWallet
      parsed.clarification_needed = false
      
      await supabase
        .from('ai_confirmations')
        .update({ parsed_data: parsed })
        .eq('id', confirmation.id)
      
      await ctx.answerCallbackQuery()
      await ctx.editMessageText(
        `✅ Dompet dipilih: *${selectedWallet}*\n\n` +
        `Klik "Simpan" untuk melanjutkan.`,
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Simpan', callback_data: `save_${txId}` },
              { text: '❌ Batal', callback_data: `cancel_${txId}` },
            ]],
          },
        }
      )
      console.log('Wallet selected:', selectedWallet)
      return
    }

    if (action === 'save') {
      try {
        const parsed = confirmation.parsed_data as any
        
        if (!parsed.wallet && parsed.suggested_wallets?.length) {
          await ctx.answerCallbackQuery({ 
            show_alert: true, 
            text: 'Pilih dompet terlebih dahulu' 
          })
          return
        }

        const { data: transaction, error: txError } = await supabase
          .from('transactions')
          .insert({
            type: parsed.type,
            amount: parsed.amount,
            description: parsed.description || confirmation.original_message,
            group_id: 1,
            telegram_user_id: userId,
            transaction_date: new Date().toISOString(),
          })
          .select()
          .single()
        
        if (txError) throw txError
        
        await supabase.from('ai_confirmations').update({ status: 'confirmed' }).eq('id', confirmation.id)
        
        console.log('Transaction created:', transaction)
        await ctx.answerCallbackQuery()
        await ctx.editMessageText('✅ Transaksi berhasil disimpan!\n\nSudah masuk database.')
      } catch (error: any) {
        console.error('Save error:', error)
        await ctx.answerCallbackQuery({ show_alert: true })
        await ctx.editMessageText('❌ Error: ' + error.message)
      }
    }
  })

  bot.catch((err) => console.error('Bot error:', err))
  console.log('Bot handlers setup complete!')
}
