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
      `Saya asisten AI untuk mencatat keuangan Anda.\n\n` +
      `*Cara Pakai:*\n` +
      `1. Ketik: "Beli makan 50rb dari GoPay"\n` +
      `2. AI akan parse & konfirmasi\n` +
      `3. Pilih dompet & kategori\n` +
      `4. Klik "Simpan"\n\n` +
      `*Commands:*\n` +
      `/start - Mulai\n` +
      `/help - Bantuan\n` +
      `/kategori - Lihat kategori\n` +
      `/dompet - Lihat dompet\n` +
      `/tambah_kategori Nama - Tambah kategori\n` +
      `/tambah_dompet Nama - Tambah dompet\n\n` +
      `💡 *Tips:* Sebutkan dompet agar lebih cepat!\n` +
      `Contoh: "Beli kopi 25rb dari GoPay"`,
      { parse_mode: 'Markdown' }
    )
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(
      `📖 *Bantuan*\n\n` +
      `*Input Transaksi:*\n` +
      `Kirim pesan natural:\n` +
      `- "Beli kopi 25rb dari GoPay"\n` +
      `- "Gaji 15 juta ke BCA"\n` +
      `- "Transfer 500k BCA ke GoPay"\n\n` +
      `*Commands:*\n` +
      `/start - Mulai\n` +
      `/help - Bantuan\n` +
      `/kategori - List kategori\n` +
      `/dompet - List dompet\n` +
      `/tambah_kategori Makanan - Tambah kategori\n` +
      `/tambah_dompet GoPay - Tambah dompet\n\n` +
      `*PENTING:*\n` +
      `- Untuk pengeluaran, WAJIB pilih dompet\n` +
      `- Jika tidak sebut, bot akan tampilkan pilihan`,
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
    
    if (!data?.length) {
      return ctx.reply(
        `📭 *Belum ada kategori*\n\n` +
        `Gunakan command:\n` +
        `/tambah_kategori NamaKategori\n\n` +
        `Contoh: /tambah_kategori Makanan`,
        { parse_mode: 'Markdown' }
      )
    }
    
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
    
    if (!data?.length) {
      return ctx.reply(
        `💳 *Belum ada dompet*\n\n` +
        `Gunakan command:\n` +
        `/tambah_dompet NamaDompet\n\n` +
        `Contoh: /tambah_dompet GoPay`,
        { parse_mode: 'Markdown' }
      )
    }
    
    const list = data.map(w => `• ${w.name}`).join('\n')
    await ctx.reply(`💳 *Dompet Tersedia:*\n\n${list}`, { parse_mode: 'Markdown' })
  })

  bot.command('tambah_kategori', async (ctx) => {
    if (!supabase) return ctx.reply('❌ Database tidak terkoneksi')
    
    const args = ctx.message.text.split(' ').slice(1).join(' ')
    if (!args) return ctx.reply('❌ Format: /tambah_kategori NamaKategori')
    
    const { error } = await supabase
      .from('categories')
      .insert({ name: args.trim(), group_id: 1 })
    
    if (error) {
      return ctx.reply(`❌ Error: ${error.message}`)
    }
    
    await ctx.reply(`✅ Kategori "*${args.trim()}*" berhasil ditambahkan!`, { parse_mode: 'Markdown' })
  })

  bot.command('tambah_dompet', async (ctx) => {
    if (!supabase) return ctx.reply('❌ Database tidak terkoneksi')
    
    const args = ctx.message.text.split(' ').slice(1).join(' ')
    if (!args) return ctx.reply('❌ Format: /tambah_dompet NamaDompet')
    
    const { error } = await supabase
      .from('wallets')
      .insert({ name: args.trim(), group_id: 1 })
    
    if (error) {
      return ctx.reply(`❌ Error: ${error.message}`)
    }
    
    await ctx.reply(`✅ Dompet "*${args.trim()}*" berhasil ditambahkan!`, { parse_mode: 'Markdown' })
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
      const txId = Math.random().toString(36).substring(2, 8)
      
      // Fetch current categories and wallets
      const [{ data: categories }, { data: wallets }] = await Promise.all([
        supabase?.from('categories').select('name').eq('group_id', 1).order('name'),
        supabase?.from('wallets').select('name').eq('group_id', 1).order('name'),
      ])
      
      const categoryList = categories?.map(c => c.name) || []
      const walletList = wallets?.map(w => w.name) || []
      
      // Check if database is empty
      const isEmptyDB = categoryList.length === 0 && walletList.length === 0
      
      if (isEmptyDB) {
        await ctx.reply(
          `⚠️ *Database Masih Kosong!*\n\n` +
          `Sebelum catat transaksi, tambahkan dompet dulu:\n\n` +
          `/tambah_dompet GoPay\n` +
          `/tambah_dompet BCA\n` +
          `/tambah_dompet Cash\n\n` +
          `Dan kategori:\n` +
          `/tambah_kategori Makanan\n` +
          `/tambah_kategori Transport`,
          { parse_mode: 'Markdown' }
        )
        return
      }

      // Save to ai_confirmations
      if (supabase) {
        await supabase
          .from('ai_confirmations')
          .insert({
            user_id: userId,
            group_id: 1,
            original_message: message,
            parsed_data: parsed,
            status: 'pending',
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          })
        console.log('Confirmation saved with txId:', txId)
      }

      const typeLabel = parsed.type === 'income' ? 'Pemasukan' : parsed.type === 'expense' ? 'Pengeluaran' : 'Transfer'
      const amount = parsed.amount ? `Rp ${parsed.amount.toLocaleString('id-ID')}` : '❓ Belum ada nominal'

      let confirmationText = `✅ *Konfirmasi Transaksi*\n\n`
      confirmationText += `*Jenis:* ${typeLabel}\n`
      confirmationText += `*Jumlah:* ${amount}\n`
      confirmationText += `*Keterangan:* ${parsed.description}\n`

      // Category section
      if (parsed.category && parsed.category !== 'Umum') {
        confirmationText += `*Kategori:* ${parsed.category}\n`
      } else {
        confirmationText += `*Kategori:* Umum (default)\n`
      }

      // Wallet section
      if (parsed.wallet) {
        confirmationText += `*Dompet:* ${parsed.wallet} ✅\n`
      } else if (parsed.type === 'expense' || parsed.type === 'income') {
        confirmationText += `*Dompet:* ⚠️ *Belum dipilih*\n`
      }

      // Add suggestions
      if (parsed.suggested_categories?.length) {
        confirmationText += `\n💡 *Kategori baru terdeteksi:* ${parsed.suggested_categories.join(', ')}\n`
      }

      // Build keyboard - ONLY show wallet buttons if wallet not selected
      const keyboard: any[][] = []

      if (!parsed.wallet && (parsed.type === 'expense' || parsed.type === 'income')) {
        // Wallet NOT selected - show wallet buttons ONLY
        confirmationText += `\n⚠️ *Pilih dompet terlebih dahulu:*\n`
        
        if (walletList.length > 0) {
          // Show wallet buttons in rows of 2
          for (let i = 0; i < walletList.length; i += 2) {
            const row = []
            row.push({ text: `💳 ${walletList[i]}`, callback_data: `wallet_${txId}_${walletList[i]}` })
            if (walletList[i + 1]) {
              row.push({ text: `💳 ${walletList[i + 1]}`, callback_data: `wallet_${txId}_${walletList[i + 1]}` })
            }
            keyboard.push(row)
          }
        } else {
          confirmationText += `\n💳 Belum ada dompet. Gunakan /tambah_dompet`
        }
      } else {
        // Wallet already selected - show Save/Cancel buttons
        if (parsed.wallet) {
          confirmationText += `\n✅ *Siap disimpan!*\n`
        }
        
        keyboard.push([
          { text: '✅ Simpan', callback_data: `save_${txId}` },
          { text: '❌ Batal', callback_data: `cancel_${txId}` },
        ])
      }

      await ctx.reply(confirmationText, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard },
      })
      console.log('Confirmation sent')
    } catch (error: any) {
      console.error('Message error:', error)
      await ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi.')
    }
  })

  bot.on('callback_query:data', async (ctx) => {
    const parts = ctx.callbackQuery.data.split('_')
    const action = parts[0]
    const txId = parts[1]
    const selectedWallet = parts[2]
    
    console.log('Callback:', action, txId, 'wallet:', selectedWallet, 'from:', ctx.from?.id)

    if (!supabase) {
      await ctx.answerCallbackQuery({ show_alert: true, text: 'Database error' })
      return
    }

    const userId = ctx.from?.id.toString()
    const fiveMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    
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
      await ctx.answerCallbackQuery({ show_alert: true, text: 'Transaksi sudah expired' })
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
      
      const amount = parsed.amount ? `Rp ${parsed.amount.toLocaleString('id-ID')}` : '❓'
      const typeLabel = parsed.type === 'income' ? 'Pemasukan' : 'Pengeluaran'
      
      await ctx.editMessageText(
        `✅ *Dompet Dipilih: ${selectedWallet}*\n\n` +
        `*Jenis:* ${typeLabel}\n` +
        `*Jumlah:* ${amount}\n` +
        `*Keterangan:* ${parsed.description}\n` +
        `*Kategori:* ${parsed.category || 'Umum'}\n` +
        `*Dompet:* ${selectedWallet} ✅\n\n` +
        `Klik *Simpan* untuk menyimpan transaksi.`,
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
        
        if (!parsed.wallet) {
          await ctx.answerCallbackQuery({ show_alert: true, text: 'Pilih dompet dulu!' })
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
