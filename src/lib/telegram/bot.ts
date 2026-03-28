import { Bot } from 'grammy'
import { createClient } from '@supabase/supabase-js'
import { ParseResult } from '@/lib/ai/parser'
import { getTransactionReport, ReportSummary } from './reports'

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

async function sendReport(ctx: any, report: ReportSummary) {
  let text = `📊 <b>Laporan ${report.period}</b>\n\n`
  
  text += `<b>💰 Ringkasan:</b>\n`
  text += `Pemasukan: <b>Rp ${report.totalIncome.toLocaleString('id-ID')}</b>\n`
  text += `Pengeluaran: <b>Rp ${report.totalExpense.toLocaleString('id-ID')}</b>\n`
  text += `Saldo: <b>Rp ${report.balance.toLocaleString('id-ID')}</b>\n`
  text += `Transaksi: <b>${report.transactionCount}</b>\n\n`
  
  if (report.byWallet.length > 0) {
    text += `<b>💳 Berdasarkan Dompet:</b>\n`
    report.byWallet.forEach(wallet => {
      text += `• ${escapeHtml(wallet.name)}: Rp ${wallet.amount.toLocaleString('id-ID')}\n`
    })
  }
  
  await ctx.reply(text, { parse_mode: 'HTML' })
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
      `/edit_saldo - Edit saldo dompet\n` +
      `/saldo - Cek saldo dompet\n` +
      `/kategori - Lihat kategori\n` +
      `/dompet - Lihat dompet`,
      { parse_mode: 'HTML' }
    )
  })

  bot.command('help', async (ctx) => {
    await ctx.reply(
      `📖 <b>Bantuan CatatUang Bot</b>\n\n` +
      `<b>📝 Manajemen Transaksi:</b>\n` +
      `/start - Mulai bot\n` +
      `Ketik natural: "Beli kopi 25rb dari GoPay"\n\n` +
      `<b>🔹 Laporan Keuangan:</b>\n` +
      `/hari_ini - Laporan hari ini\n` +
      `/minggu_ini - Laporan minggu ini\n` +
      `/bulan_ini - Laporan bulan ini\n\n` +
      `<b>🔹 Cek Saldo:</b>\n` +
      `/saldo - Cek semua saldo dompet\n` +
      `/saldo GoPay - Cek saldo GoPay\n\n` +
      `<b>🔹 Edit Saldo:</b>\n` +
      `/edit_saldo - Edit saldo (multi-step)\n` +
      `  1. Pilih dompet dari button\n` +
      `  2. Masukkan nominal\n` +
      `  3. Saldo terupdate otomatis\n\n` +
      `<b>🔹 Manajemen Dompet:</b>\n` +
      `/dompet - Lihat daftar dompet\n` +
      `/tambah_dompet Nama - Tambah dompet baru\n` +
      `  Contoh: /tambah_dompet GoPay\n\n` +
      `<b>💡 Tips:</b>\n` +
      `- Selalu sebutkan nominal (25rb, 100k, 1jt)\n` +
      `- Sebutkan dompet untuk transaksi\n` +
      `- Bot akan konfirmasi sebelum simpan\n` +
      `- AI otomatis membuat keterangan yang jelas`,
      { parse_mode: 'HTML' }
    )
  })

  bot.command('saldo', async (ctx) => {
    if (!supabase) return ctx.reply('❌ Database tidak terkoneksi', { parse_mode: 'HTML' })
    
    const args = ctx.message.text.split(' ').slice(1).join(' ').trim()
    
    if (args) {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('name', args)
        .eq('group_id', 1)
        .single()
      
      if (!wallet) {
        return ctx.reply(`❌ Dompet "<b>${escapeHtml(args)}</b>" tidak ditemukan`, { parse_mode: 'HTML' })
      }
      
      await ctx.reply(
        `💳 <b>${escapeHtml(wallet.name)}</b>\n` +
        `Saldo: <b>Rp ${(wallet.saldo || 0).toLocaleString('id-ID')}</b>`,
        { parse_mode: 'HTML' }
      )
    } else {
      const { data: wallets } = await supabase
        .from('wallets')
        .select('*')
        .eq('group_id', 1)
        .order('name')
      
      if (!wallets?.length) {
        return ctx.reply('📭 Belum ada dompet', { parse_mode: 'HTML' })
      }
      
      const total = wallets.reduce((sum, w) => sum + (w.saldo || 0), 0)
      const list = wallets.map(w => 
        `• ${escapeHtml(w.name)}: Rp ${(w.saldo || 0).toLocaleString('id-ID')}`
      ).join('\n')
      
      await ctx.reply(
        `💳 <b>Saldo Dompet</b>\n\n${list}\n\n` +
        `<b>Total: Rp ${total.toLocaleString('id-ID')}</b>`,
        { parse_mode: 'HTML' }
      )
    }
  })

  bot.command('edit_saldo', async (ctx) => {
    if (!supabase) return ctx.reply('❌ Database tidak terkoneksi', { parse_mode: 'HTML' })
    
    const { data: wallets } = await supabase
      .from('wallets')
      .select('id, name, saldo')
      .eq('group_id', 1)
      .order('name')
    
    if (!wallets?.length) {
      return ctx.reply(
        `📭 <b>Belum ada dompet</b>\n\n` +
        `Tambahkan dompet dulu dengan:\n` +
        `/tambah_dompet NamaDompet`,
        { parse_mode: 'HTML' }
      )
    }
    
    const userId = ctx.from?.id.toString()
    const txId = `es_${userId}_${Date.now()}`
    
    await supabase.from('ai_confirmations').insert({
      user_id: userId,
      group_id: 1,
      original_message: '/edit_saldo',
      parsed_data: {
        type: 'edit_saldo',
        step: 'select_wallet',
      },
      status: 'pending',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })
    
    const list = wallets.map(w => 
      `• ${escapeHtml(w.name)}: Rp ${(w.saldo || 0).toLocaleString('id-ID')}`
    ).join('\n')
    
    const keyboard: any[][] = []
    for (let i = 0; i < wallets.length; i += 2) {
      const row = [{ 
        text: `💳 ${wallets[i].name}`, 
        callback_data: `ew_${wallets[i].id}_${wallets[i].name}` 
      }]
      if (wallets[i + 1]) {
        row.push({ 
          text: `💳 ${wallets[i + 1].name}`, 
          callback_data: `ew_${wallets[i + 1].id}_${wallets[i + 1].name}` 
        })
      }
      keyboard.push(row)
    }
    
    await ctx.reply(
      `💳 <b>Pilih Dompet untuk Edit Saldo</b>\n\n` +
      `Saldo Saat Ini:\n${list}\n\n` +
      `<i>Klik dompet untuk melanjutkan:</i>`,
      { parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard } }
    )
  })

  bot.command('dompet', async (ctx) => {
    if (!supabase) return
    const { data } = await supabase.from('wallets').select('name').eq('group_id', 1).order('name')
    if (!data?.length) return ctx.reply('📭 Belum ada dompet', { parse_mode: 'HTML' })
    const list = data.map((w: any) => `• ${escapeHtml(w.name)}`).join('\n')
    await ctx.reply(`💳 <b>Dompet:</b>\n${list}`, { parse_mode: 'HTML' })
  })

  bot.command('tambah_dompet', async (ctx) => {
    if (!supabase) return
    const args = ctx.message.text.split(' ').slice(1).join(' ')
    if (!args) return ctx.reply('❌ Format: /tambah_dompet Nama', { parse_mode: 'HTML' })
    const { error } = await supabase.from('wallets').insert({ name: args.trim(), group_id: 1, saldo: 0 })
    if (error) return ctx.reply(`❌ Error: ${escapeHtml(error.message)}`, { parse_mode: 'HTML' })
    await ctx.reply(`✅ Dompet "<b>${escapeHtml(args.trim())}</b>" ditambahkan!`, { parse_mode: 'HTML' })
  })

  bot.command('hari_ini', async (ctx) => {
    const userId = ctx.from?.id.toString()
    if (!userId) return
    
    await ctx.reply('⏳ <b>Mengambil laporan hari ini...</b>', { parse_mode: 'HTML' })
    
    const report = await getTransactionReport(userId, 1)
    if (!report) {
      return ctx.reply('❌ Gagal mengambil laporan', { parse_mode: 'HTML' })
    }
    
    await sendReport(ctx, report)
  })

  bot.command('minggu_ini', async (ctx) => {
    const userId = ctx.from?.id.toString()
    if (!userId) return
    
    await ctx.reply('⏳ <b>Mengambil laporan minggu ini...</b>', { parse_mode: 'HTML' })
    
    const report = await getTransactionReport(userId, 7)
    if (!report) {
      return ctx.reply('❌ Gagal mengambil laporan', { parse_mode: 'HTML' })
    }
    
    await sendReport(ctx, report)
  })

  bot.command('bulan_ini', async (ctx) => {
    const userId = ctx.from?.id.toString()
    if (!userId) return
    
    await ctx.reply('⏳ <b>Mengambil laporan bulan ini...</b>', { parse_mode: 'HTML' })
    
    const report = await getTransactionReport(userId, 30)
    if (!report) {
      return ctx.reply('❌ Gagal mengambil laporan', { parse_mode: 'HTML' })
    }
    
    await sendReport(ctx, report)
  })

  bot.on('message:text', async (ctx) => {
    const message = ctx.message.text
    const userId = ctx.from?.id.toString()
    console.log('Message from:', userId, 'Text:', message)

    if (!message.startsWith('/')) {
      const { data: editState } = await supabase
        .from('ai_confirmations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .eq('parsed_data->>type', 'edit_saldo')
        .eq('parsed_data->>step', 'input_nominal')
        .gt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (editState) {
        const nominalStr = message.replace(/[^0-9-]/g, '').trim()
        const nominal = parseInt(nominalStr)
        const parsedData = editState.parsed_data as any
        
        if (isNaN(nominal) || nominal === 0) {
          return ctx.reply(
            `❌ <b>Nominal tidak valid</b>\n\n` +
            `Masukkan nominal angka yang valid.\n` +
            `Contoh: 100000 atau 100.000\n\n` +
            `/edit_saldo - Mulai ulang`,
            { parse_mode: 'HTML' }
          )
        }
        
        const walletId = parseInt(parsedData.wallet_id)
        const walletName = parsedData.wallet_name
        const previousBalance = parseFloat(parsedData.previous_balance) || 0
        const newBalance = previousBalance + nominal
        
        if (newBalance < 0) {
          return ctx.reply(
            `❌ <b>Saldo tidak boleh negatif</b>\n\n` +
            `Saldo saat ini: Rp ${previousBalance.toLocaleString('id-ID')}\n` +
            `Perubahan: ${nominal >= 0 ? '+' : ''}Rp ${nominal.toLocaleString('id-ID')}\n` +
            `Saldo Baru: Rp ${newBalance.toLocaleString('id-ID')} (negatif)\n\n` +
            `/edit_saldo - Mulai ulang`,
            { parse_mode: 'HTML' }
          )
        }
        
        const { error: updateError } = await supabase
          .from('wallets')
          .update({ saldo: newBalance })
          .eq('id', walletId)
        
        if (updateError) {
          return ctx.reply(`❌ Error: ${escapeHtml(updateError.message)}`, { parse_mode: 'HTML' })
        }
        
        await supabase
          .from('wallet_balance_history')
          .insert({
            wallet_id: walletId,
            previous_balance: previousBalance,
            new_balance: newBalance,
            change_amount: nominal,
            change_type: 'adjustment',
            created_by: userId,
            description: `Manual adjustment via Telegram by ${ctx.from?.first_name || 'user'}`,
          })
        
        await supabase.from('ai_confirmations').update({ status: 'confirmed' }).eq('id', editState.id)
        
        await ctx.reply(
          `✅ <b>Saldo Berhasil Diupdate!</b>\n\n` +
          `Dompet: ${escapeHtml(walletName)}\n` +
          `Perubahan: ${nominal >= 0 ? '+' : ''}Rp ${nominal.toLocaleString('id-ID')}\n` +
          `Saldo Sebelumnya: Rp ${previousBalance.toLocaleString('id-ID')}\n` +
          `Saldo Baru: <b>Rp ${newBalance.toLocaleString('id-ID')}</b>`,
          { parse_mode: 'HTML' }
        )
        return
      }
    }

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://catatuang-iota.vercel.app'
      
      const response = await fetch(`${appUrl}/api/parse-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, group_id: 1 }),
      })

      const result = await response.json()
      if (result.error) return ctx.reply(`❌ Error: ${escapeHtml(result.error)}`, { parse_mode: 'HTML' })

      const parseResult = result.data as ParseResult
      const txId = Math.random().toString(36).substring(2, 10)
      
      if (parseResult.status === 'tidak_relevan' || parseResult.status === 'permintaan_laporan') {
        return ctx.reply(parseResult.pesan_balasan, { parse_mode: 'HTML' })
      }

      if (parseResult.status === 'ambigu') {
        return ctx.reply(`⚠️ ${parseResult.pesan_balasan}`, { parse_mode: 'HTML' })
      }

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

      const { data: wallets } = await supabase
        ?.from('wallets')
        .select('name')
        .eq('group_id', 1)
      
      const walletList = wallets?.map((w: any) => w.name) || []
      const tx = parseResult.transaksi[0]
      
      let text = `✅ <b>Konfirmasi Transaksi</b>\n\n`
      text += `<b>Jenis:</b> ${tx.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}\n`
      text += `<b>Jumlah:</b> ${tx.nominal ? `Rp ${tx.nominal.toLocaleString('id-ID')}` : '❓'}\n`
      text += `<b>Ket:</b> ${escapeHtml(tx.keterangan)}\n`
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
    const data = ctx.callbackQuery.data
    console.log('Callback data:', data)
    
    if (data.startsWith('ew_')) {
      const parts = data.split('_')
      const walletId = parts[1]
      const walletName = parts.slice(2).join('_')
      const userId = ctx.from?.id.toString()
      
      console.log('Edit wallet selected:', { walletId, walletName, userId })
      
      const { data: editState } = await supabase
        .from('ai_confirmations')
        .select('*')
        .eq('user_id', userId)
        .eq('parsed_data->>type', 'edit_saldo')
        .eq('parsed_data->>step', 'select_wallet')
        .gt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (!editState) {
        return ctx.answerCallbackQuery({ show_alert: true, text: 'Session expired. Gunakan /edit_saldo lagi.' })
      }
      
      const { data: wallet } = await supabase
        .from('wallets')
        .select('saldo')
        .eq('id', walletId)
        .single()
      
      const previousBalance = wallet?.saldo || 0
      
      await supabase
        .from('ai_confirmations')
        .update({
          parsed_data: {
            type: 'edit_saldo',
            step: 'input_nominal',
            wallet_id: walletId,
            wallet_name: walletName,
            previous_balance: previousBalance,
          }
        })
        .eq('id', editState.id)
      
      await ctx.answerCallbackQuery()
      await ctx.editMessageText(
        `💳 <b>${escapeHtml(walletName)}</b>\n\n` +
        `Saldo Saat Ini: <b>Rp ${previousBalance.toLocaleString('id-ID')}</b>\n\n` +
        `<b>Masukkan Nominal:</b>\n` +
        `<i>Ketik angka untuk menambah/mengurangi saldo</i>\n\n` +
        `Contoh:\n` +
        `100000 → Tambah 100.000\n` +
        `-50000 → Kurangi 50.000\n\n` +
        `<i>Ketik /cancel untuk batal</i>`,
        { parse_mode: 'HTML' }
      )
      return
    }

    const parts = data.split('_')
    const action = parts[0], txId = parts[1], selectedValue = parts[2]
    console.log('Transaction callback:', action, txId, 'value:', selectedValue)

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

    if (action === 'category') {
      // Categories removed - this handler is deprecated
      await ctx.answerCallbackQuery({ show_alert: true, text: 'Kategori sudah dihapus' })
      return
    }

    if (action === 'save') {
      try {
        const parseResult = confirmation.parsed_data as ParseResult
        const tx = parseResult.transaksi[0]
        
        if (!tx.dompet) {
          return ctx.answerCallbackQuery({ show_alert: true, text: 'Pilih dompet dulu!' })
        }

        console.log('Saving transaction:', {
          wallet_name: tx.dompet,
          type: tx.jenis,
          amount: tx.nominal,
          user: userId
        })

        const { data: walletData } = await supabase
          .from('wallets')
          .select('id, saldo')
          .eq('name', tx.dompet)
          .eq('group_id', 1)
          .single()
        
        if (!walletData) {
          console.error('Wallet not found:', tx.dompet)
          return ctx.answerCallbackQuery({ show_alert: true, text: 'Dompet tidak ditemukan' })
        }

        console.log('Current wallet balance:', walletData.saldo)

        if (tx.jenis === 'pengeluaran' && tx.nominal) {
          const currentBalance = walletData.saldo || 0
          if (tx.nominal > currentBalance) {
            console.log('Insufficient balance:', { current: currentBalance, needed: tx.nominal })
            return ctx.answerCallbackQuery({
              show_alert: true,
              text: `❌ Saldo tidak cukup! Saldo ${tx.dompet}: Rp ${currentBalance.toLocaleString('id-ID')}`
            })
          }
        }

        let walletId = walletData.id

        const { data: transaction, error: txError } = await supabase
          .from('transactions')
          .insert({
            type: tx.jenis === 'pemasukan' ? 'income' : 'expense',
            amount: tx.nominal,
            description: tx.keterangan,
            group_id: 1,
            telegram_user_id: userId,
            wallet_id: walletId,
            wallet_name: tx.dompet,
            transaction_date: new Date().toISOString(),
          })
          .select('id')
          .single()
        
        if (txError) {
          console.error('Transaction insert error:', txError)
          throw txError
        }

        console.log('Transaction inserted, ID:', transaction?.id)

        if (ctx.from) {
          await supabase
            .from('telegram_users')
            .upsert({
              id: userId,
              username: ctx.from.username || null,
              first_name: ctx.from.first_name || null,
              last_name: ctx.from.last_name || null,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' })
        }

        let walletBalance = walletData.saldo || 0
        let changeAmount = 0
        let changeType = 'adjustment'
        
        if (tx.jenis === 'pemasukan' && tx.nominal) {
          walletBalance += tx.nominal
          changeAmount = tx.nominal
          changeType = 'income'
          console.log('Income: adding', tx.nominal, 'to balance')
        } else if (tx.jenis === 'pengeluaran' && tx.nominal) {
          walletBalance -= tx.nominal
          changeAmount = -tx.nominal
          changeType = 'expense'
          console.log('Expense: subtracting', tx.nominal, 'from balance')
        }

        console.log('New balance:', walletBalance)

        const { error: updateError } = await supabase
          .from('wallets')
          .update({ saldo: walletBalance })
          .eq('id', walletId)
        
        if (updateError) {
          console.error('Balance update error:', updateError)
          throw updateError
        }

        const { error: historyError } = await supabase
          .from('wallet_balance_history')
          .insert({
            wallet_id: walletId,
            previous_balance: walletData.saldo,
            new_balance: walletBalance,
            change_amount: changeAmount,
            change_type: changeType,
            transaction_id: transaction?.id || null,
            created_by: userId || null,
            description: `${changeType === 'income' ? 'Pemasukan' : 'Pengeluaran'}: ${tx.keterangan}`,
          })
        
        if (historyError) {
          console.error('History log error:', historyError)
        }

        console.log('Balance updated successfully:', walletBalance)
        
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
