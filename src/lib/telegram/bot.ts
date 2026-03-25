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
      `<b>Commands:</b>\n` +
      `/start - Mulai\n` +
      `/help - Bantuan\n` +
      `/kategori - Lihat kategori\n` +
      `/dompet - Lihat dompet\n` +
      `/tambah_kategori Nama - Tambah kategori\n` +
      `/tambah_dompet Nama - Tambah dompet\n\n` +
      `💡 <b>Tips:</b> "Beli kopi 25rb dari GoPay"`,
      { parse_mode: 'HTML' }
    )
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(
      `📖 <b>Bantuan</b>\n\n` +
      `<b>Contoh:</b>\n` +
      `- "Beli kopi 25rb dari GoPay"\n` +
      `- "Gaji 15 juta"\n\n` +
      `<b>PENTING:</b> WAJIB pilih dompet!`,
      { parse_mode: 'HTML' }
    )
  })

  bot.command('kategori', async (ctx) => {
    if (!supabase) return
    const { data } = await supabase.from('categories').select('name').eq('group_id', 1).order('name')
    if (!data?.length) return ctx.reply('📭 Belum ada kategori. Gunakan /tambah_kategori Nama', { parse_mode: 'HTML' })
    const list = data.map((c: any) => `• ${escapeHtml(c.name)}`).join('\n')
    await ctx.reply(`📋 <b>Kategori:</b>\n${list}`, { parse_mode: 'HTML' })
  })

  bot.command('dompet', async (ctx) => {
    if (!supabase) return
    const { data } = await supabase.from('wallets').select('name').eq('group_id', 1).order('name')
    if (!data?.length) return ctx.reply('📭 Belum ada dompet. Gunakan /tambah_dompet Nama', { parse_mode: 'HTML' })
    const list = data.map((w: any) => `• ${escapeHtml(w.name)}`).join('\n')
    await ctx.reply(`💳 <b>Dompet:</b>\n${list}`, { parse_mode: 'HTML' })
  })

  bot.command('tambah_kategori', async (ctx) => {
    if (!supabase) return
    const args = ctx.message.text.split(' ').slice(1).join(' ')
    if (!args) return ctx.reply('❌ Format: /tambah_kategori Nama')
    const { error } = await supabase.from('categories').insert({ name: args.trim(), group_id: 1 })
    if (error) return ctx.reply(`❌ Error: ${escapeHtml(error.message)}`, { parse_mode: 'HTML' })
    await ctx.reply(`✅ Kategori "<b>${escapeHtml(args.trim())}</b>" ditambahkan!`, { parse_mode: 'HTML' })
  })

  bot.command('tambah_dompet', async (ctx) => {
    if (!supabase) return
    const args = ctx.message.text.split(' ').slice(1).join(' ')
    if (!args) return ctx.reply('❌ Format: /tambah_dompet Nama')
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

      const parsed = result.data
      const txId = Math.random().toString(36).substring(2, 8)
      
      const [{ data: categories }, { data: wallets }] = await Promise.all([
        supabase?.from('categories').select('name').eq('group_id', 1),
        supabase?.from('wallets').select('name').eq('group_id', 1),
      ])
      
      const categoryList = categories?.map((c: any) => c.name) || []
      const walletList = wallets?.map((w: any) => w.name) || []
      const isEmptyDB = categoryList.length === 0 && walletList.length === 0
      
      if (isEmptyDB) {
        return ctx.reply(
          `⚠️ <b>Database Kosong!</b>\n\n` +
          `Tambahkan dompet:\n/tambah_dompet GoPay\n\n` +
          `Tambahkan kategori:\n/tambah_kategori Makanan`,
          { parse_mode: 'HTML' }
        )
      }

      if (supabase) {
        await supabase.from('ai_confirmations').insert({
          user_id: userId,
          group_id: 1,
          original_message: message,
          parsed_data: parsed,
          status: 'pending',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        })
        console.log('Confirmation saved:', txId)
      }

      const typeLabel = parsed.type === 'income' ? 'Pemasukan' : parsed.type === 'expense' ? 'Pengeluaran' : 'Transfer'
      const amount = parsed.amount ? `Rp ${parsed.amount.toLocaleString('id-ID')}` : '❓'

      let text = `✅ <b>Konfirmasi</b>\n\n`
      text += `<b>Jenis:</b> ${typeLabel}\n`
      text += `<b>Jumlah:</b> ${amount}\n`
      text += `<b>Ket:</b> ${escapeHtml(parsed.description)}\n`
      text += `<b>Kategori:</b> ${parsed.category ? escapeHtml(parsed.category) : 'Umum'}\n`
      text += parsed.wallet ? `<b>Dompet:</b> ${escapeHtml(parsed.wallet)} ✅\n` : `<b>Dompet:</b> ⚠️ Pilih dulu\n`

      const keyboard: any[][] = []

      if (!parsed.wallet && (parsed.type === 'expense' || parsed.type === 'income')) {
        text += `\n⚠️ <b>Pilih dompet:</b>\n`
        if (walletList.length) {
          for (let i = 0; i < walletList.length; i += 2) {
            const row = [{ text: `💳 ${walletList[i]}`, callback_data: `wallet_${txId}_${walletList[i]}` }]
            if (walletList[i + 1]) row.push({ text: `💳 ${walletList[i + 1]}`, callback_data: `wallet_${txId}_${walletList[i + 1]}` })
            keyboard.push(row)
          }
        } else {
          text += `\n💳 Belum ada dompet. /tambah_dompet`
        }
      } else {
        if (parsed.wallet) text += `\n✅ <b>Siap disimpan!</b>\n`
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
    const action = parts[0], txId = parts[1], selectedWallet = parts[2]
    console.log('Callback:', action, txId, 'wallet:', selectedWallet)

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
      const parsed = confirmation.parsed_data as any
      parsed.wallet = selectedWallet
      
      await supabase.from('ai_confirmations').update({ parsed_data: parsed }).eq('id', confirmation.id)
      await ctx.answerCallbackQuery()
      
      const amount = parsed.amount ? `Rp ${parsed.amount.toLocaleString('id-ID')}` : '❓'
      await ctx.editMessageText(
        `✅ <b>Dompet: ${escapeHtml(selectedWallet)}</b>\n\n` +
        `<b>Jenis:</b> ${parsed.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}\n` +
        `<b>Jumlah:</b> ${amount}\n` +
        `<b>Ket:</b> ${escapeHtml(parsed.description)}\n\n` +
        `Klik <b>Simpan</b> untuk menyimpan.`,
        { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[
          { text: '✅ Simpan', callback_data: `save_${txId}` },
          { text: '❌ Batal', callback_data: `cancel_${txId}` },
        ]] }}
      )
      return
    }

    if (action === 'save') {
      try {
        const parsed = confirmation.parsed_data as any
        if (!parsed.wallet) return ctx.answerCallbackQuery({ show_alert: true, text: 'Pilih dompet!' })

        // Lookup wallet_id and category_id
        let walletId = null
        let categoryId = null
        
        if (parsed.wallet) {
          const { data: walletData } = await supabase
            .from('wallets')
            .select('id')
            .eq('name', parsed.wallet)
            .eq('group_id', 1)
            .single()
          walletId = walletData?.id || null
        }
        
        if (parsed.category) {
          const { data: catData } = await supabase
            .from('categories')
            .select('id')
            .eq('name', parsed.category)
            .eq('group_id', 1)
            .single()
          categoryId = catData?.id || null
        }

        const { data: transaction, error: txError } = await supabase
          .from('transactions')
          .insert({
            type: parsed.type,
            amount: parsed.amount,
            description: parsed.description || confirmation.original_message,
            group_id: 1,
            telegram_user_id: userId,
            wallet_id: walletId,
            category_id: categoryId,
            wallet_name: parsed.wallet,
            category_name: parsed.category || 'Umum',
            transaction_date: new Date().toISOString(),
          })
          .select()
          .single()
        
        if (txError) throw txError
        
        await supabase.from('ai_confirmations').update({ status: 'confirmed' }).eq('id', confirmation.id)
        
        console.log('Transaction created:', transaction)
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
