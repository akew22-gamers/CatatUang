import { Bot } from 'grammy'
import { createClient } from '@supabase/supabase-js'
import { ParseResult } from '@/lib/ai/parser'

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

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function setupBotHandlers() {
  if (!token) {
    console.error('Cannot setup handlers: TELEGRAM_BOT_TOKEN missing')
    return
  }

  console.log('Setting up Telegram bot handlers...')

  bot.command('start', async (ctx) => {
    await ctx.reply(
      `👋 <b>Halo! Saya CatatUang Bot</b>\n\n` +
      `Saya asisten AI untuk mencatat keuangan.\n\n` +
      `<b>Cara Pakai:</b>\n` +
      `1. Ketik: "Beli kopi 25rb dari GoPay"\n` +
      `2. Bot akan konfirmasi\n` +
      `3. Klik Simpan\n\n` +
      `<b>Commands:</b>\n` +
      `/start - Mulai\n` +
      `/help - Bantuan\n` +
      `/kategori - Lihat kategori\n` +
      `/dompet - Lihat dompet`,
      { parse_mode: 'HTML' }
    )
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(
      `📖 <b>Bantuan</b>\n\n` +
      `<b>Contoh:</b> "Beli kopi 25rb dari GoPay"`,
      { parse_mode: 'HTML' }
    )
  })

  bot.command('kategori', async (ctx) => {
    if (!supabase) return
    const { data } = await supabase.from('categories').select('name').eq('group_id', 1).order('name')
    if (!data?.length) return ctx.reply('📭 Belum ada kategori', { parse_mode: 'HTML' })
    const list = data.map((c: any) => `• ${escapeHtml(c.name)}`).join('\n')
    await ctx.reply(`📋 <b>Kategori:</b>\n${list}`, { parse_mode: 'HTML' })
  })

  bot.command('dompet', async (ctx) => {
    if (!supabase) return
    const { data } = await supabase.from('wallets').select('name').eq('group_id', 1).order('name')
    if (!data?.length) return ctx.reply('📭 Belum ada dompet', { parse_mode: 'HTML' })
    const list = data.map((w: any) => `• ${escapeHtml(w.name)}`).join('\n')
    await ctx.reply(`💳 <b>Dompet:</b>\n${list}`, { parse_mode: 'HTML' })
  })

  bot.command('tambah_kategori', async (ctx) => {
    if (!supabase) return
    const args = ctx.message.text.split(' ').slice(1).join(' ')
    if (!args) return ctx.reply('❌ Format: /tambah_kategori Nama', { parse_mode: 'HTML' })
    const { error } = await supabase.from('categories').insert({ name: args.trim(), group_id: 1 })
    if (error) return ctx.reply(`❌ Error: ${escapeHtml(error.message)}`, { parse_mode: 'HTML' })
    await ctx.reply(`✅ Kategori "<b>${escapeHtml(args.trim())}</b>" ditambahkan!`, { parse_mode: 'HTML' })
  })

  bot.command('tambah_dompet', async (ctx) => {
    if (!supabase) return
    const args = ctx.message.text.split(' ').slice(1).join(' ')
    if (!args) return ctx.reply('❌ Format: /tambah_dompet Nama', { parse_mode: 'HTML' })
    const { error } = await supabase.from('wallets').insert({ name: args.trim(), group_id: 1 })
    if (error) return ctx.reply(`❌ Error: ${escapeHtml(error.message)}`, { parse_mode: 'HTML' })
    await ctx.reply(`✅ Dompet "<b>${escapeHtml(args.trim())}</b>" ditambahkan!`, { parse_mode: 'HTML' })
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
      if (result.error) return ctx.reply(`❌ Error: ${escapeHtml(result.error)}`, { parse_mode: 'HTML' })

      const parseResult = result.data as ParseResult
      const txId = Math.random().toString(36).substring(2, 10)
      
      // Handle non-transaction statuses
      if (parseResult.status === 'tidak_relevan' || parseResult.status === 'permintaan_laporan') {
        return ctx.reply(parseResult.pesan_balasan, { parse_mode: 'HTML' })
      }

      if (parseResult.status === 'ambigu') {
        return ctx.reply(`⚠️ ${parseResult.pesan_balasan}`, { parse_mode: 'HTML' })
      }

      // Save to ai_confirmations
      if (supabase) {
        await supabase.from('ai_confirmations').insert({
          user_id: userId,
          group_id: 1,
          original_message: message,
          parsed_data: parseResult,
          status: 'pending',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        })
        console.log('Confirmation saved:', txId)
      }

      // Fetch wallets
      const [{ data: wallets }] = await Promise.all([
        supabase?.from('wallets').select('name').eq('group_id', 1),
      ])
      
      const walletList = wallets?.map((w: any) => w.name) || []
      const tx = parseResult.transaksi[0]
      
      // Always show wallet selection if not set
      let text = `✅ <b>Konfirmasi Transaksi</b>\n\n`
      text += `<b>Jenis:</b> ${tx.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}\n`
      text += `<b>Jumlah:</b> ${tx.nominal ? `Rp ${tx.nominal.toLocaleString('id-ID')}` : '❓'}\n`
      text += `<b>Ket:</b> ${escapeHtml(tx.keterangan)}\n`
      text += `<b>Kategori:</b> ${escapeHtml(tx.kategori || 'Umum')}\n`
      text += tx.dompet ? `<b>Dompet:</b> ${escapeHtml(tx.dompet)} ✅\n` : `<b>Dompet:</b> ⚠️ Belum dipilih\n`
      
      const keyboard: any[][] = []
      
      if (!tx.dompet) {
        text += `\n<i>Pilih dompet:</i>`
        if (walletList.length > 0) {
          for (let i = 0; i < walletList.length; i += 2) {
            const row = [{ text: `💳 ${walletList[i]}`, callback_data: `wallet_${txId}_${walletList[i]}` }]
            if (walletList[i + 1]) row.push({ text: `💳 ${walletList[i + 1]}`, callback_data: `wallet_${txId}_${walletList[i + 1]}` })
            keyboard.push(row)
          }
        } else {
          text += `\n\n💳 Belum ada dompet. /tambah_dompet`
        }
      } else {
        text += `\n✅ <b>Siap disimpan!</b>`
        keyboard.push([
          { text: '✅ Simpan', callback_data: `save_${txId}` },
          { text: '❌ Batal', callback_data: `cancel_${txId}` },
        ])
      }

      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard } })
    } catch (error: any) {
      console.error('Message error:', error)
      ctx.reply('❌ Terjadi kesalahan')
    }
  })

  bot.on('callback_query:data', async (ctx) => {
    const parts = ctx.callbackQuery.data.split('_')
    const action = parts[0], txId = parts[1], selectedValue = parts[2]
    console.log('Callback:', action, txId, 'value:', selectedValue)

    if (!supabase) return ctx.answerCallbackQuery({ show_alert: true, text: 'DB error' })

    const userId = ctx.from?.id.toString()
    const { data: confirmation } = await supabase
      .from('ai_confirmations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!confirmation) return ctx.answerCallbackQuery({ show_alert: true, text: 'Expired' })

    if (action === 'cancel') {
      await supabase.from('ai_confirmations').update({ status: 'rejected' }).eq('id', confirmation.id)
      await ctx.answerCallbackQuery()
      return ctx.editMessageText('❌ Dibatalkan')
    }

    if (action === 'wallet') {
      const parseResult = confirmation.parsed_data as ParseResult
      for (const tx of parseResult.transaksi) {
        tx.dompet = selectedValue
      }
      parseResult.status = 'lengkap'
      
      await supabase.from('ai_confirmations').update({ parsed_data: parseResult }).eq('id', confirmation.id)
      await ctx.answerCallbackQuery()
      
      const tx = parseResult.transaksi[0]
      const amount = tx.nominal ? `Rp ${tx.nominal.toLocaleString('id-ID')}` : '❓'
      const typeLabel = tx.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'
      
      const completeText = 
        `✅ <b>Konfirmasi Transaksi</b>\n\n` +
        `<b>Jenis:</b> ${typeLabel}\n` +
        `<b>Jumlah:</b> ${amount}\n` +
        `<b>Ket:</b> ${escapeHtml(tx.keterangan)}\n` +
        `<b>Kategori:</b> ${escapeHtml(tx.kategori || 'Umum')}\n` +
        `<b>Dompet:</b> ${escapeHtml(selectedValue)} ✅\n\n` +
        `✅ <b>Siap disimpan!</b>`
      
      await ctx.editMessageText(completeText, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Simpan', callback_data: `save_${txId}` },
            { text: '❌ Batal', callback_data: `cancel_${txId}` },
          ]],
        },
      })
      console.log('Wallet selected, showing complete confirmation:', selectedValue)
      return
    }

    if (action === 'save') {
      try {
        const parseResult = confirmation.parsed_data as ParseResult
        const tx = parseResult.transaksi[0]
        
        if (!tx.dompet) {
          return ctx.answerCallbackQuery({ show_alert: true, text: 'Pilih dompet dulu!' })
        }

        let walletId = null
        let categoryId = null
        
        if (tx.dompet) {
          const { data: walletData } = await supabase
            .from('wallets')
            .select('id')
            .eq('name', tx.dompet)
            .eq('group_id', 1)
            .single()
          walletId = walletData?.id || null
        }
        
        if (tx.kategori && tx.kategori !== 'Umum') {
          const { data: catData } = await supabase
            .from('categories')
            .select('id')
            .eq('name', tx.kategori)
            .eq('group_id', 1)
            .single()
          categoryId = catData?.id || null
        }

        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            type: tx.jenis === 'pemasukan' ? 'income' : 'expense',
            amount: tx.nominal,
            description: tx.keterangan,
            group_id: 1,
            telegram_user_id: userId,
            wallet_id: walletId,
            category_id: categoryId,
            wallet_name: tx.dompet,
            category_name: tx.kategori || 'Umum',
            transaction_date: new Date().toISOString(),
          })
        
        if (txError) throw txError
        
        await supabase.from('ai_confirmations').update({ status: 'confirmed' }).eq('id', confirmation.id)
        await ctx.answerCallbackQuery()
        await ctx.editMessageText('✅ Tersimpan di database!')
      } catch (error: any) {
        console.error('Save error:', error)
        await ctx.answerCallbackQuery({ show_alert: true })
        await ctx.editMessageText(`❌ Error: ${escapeHtml(error.message)}`)
      }
    }
  })

  bot.catch((err) => console.error('Bot error:', err))
  console.log('Bot setup complete!')
}
