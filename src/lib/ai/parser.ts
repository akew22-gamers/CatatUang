import Groq from 'groq-sdk'
import { buildPromptWithContext } from './prompts'
import { preprocessMessage, extractEmojis, extractContextFromEmojis } from './preprocessor'

const groqApiKey = process.env.GROQ_API_KEY
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null

const GROQ_MODEL = 'llama-3.1-8b-instant'

export interface ParsedTransaction {
  jenis: 'pemasukan' | 'pengeluaran'
  nominal: number | null
  dompet: string | null
  keterangan: string
}

export interface ParseResult {
  status: 'lengkap' | 'kurang_data' | 'ambigu' | 'ditolak' | 'tidak_relevan' | 'permintaan_laporan' | 'cek_saldo' | 'cek_profile'
  transaksi: ParsedTransaction[]
  pesan_balasan: string
}

export interface ParserContext {
  wallets: string[]
  walletsSaldo?: { name: string; saldo: number }[]
  group_id?: number
}

function validateParseResult(result: any): ParseResult {
  const validStatuses = ['lengkap', 'kurang_data', 'ambigu', 'ditolak', 'tidak_relevan', 'permintaan_laporan', 'cek_saldo', 'cek_profile']
  
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid response format')
  }
  
  if (!validStatuses.includes(result.status)) {
    throw new Error(`Invalid status: ${result.status}`)
  }
  
  if (!Array.isArray(result.transaksi)) {
    throw new Error('transaksi must be an array')
  }
  
  if (typeof result.pesan_balasan !== 'string') {
    throw new Error('pesan_balasan must be a string')
  }
  
  return result as ParseResult
}

export async function parseFinancialChat(
  message: string,
  context: ParserContext
): Promise<ParseResult> {
  if (!groq) {
    console.error('Groq client not initialized')
    return mockParseFinancialChat(message, context)
  }

  console.log('Parsing message:', message)
  console.log('Context:', context)

  try {
    const emojis = extractEmojis(message)
    const emojiContext = extractContextFromEmojis(emojis)
    const preprocessedMessage = preprocessMessage(message)
    const systemPrompt = buildPromptWithContext(context.wallets)
    
    const userMessage = emojiContext.length > 0
      ? `${preprocessedMessage}\n\nContext dari emoji: ${emojiContext.join(', ')}`
      : preprocessedMessage

    console.log('Preprocessed message:', preprocessedMessage)
    console.log('Final user message:', userMessage)

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1024,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from Groq API')
    }

    console.log('Groq raw response:', content)

    const parsed = JSON.parse(content)
    
    // Post-processing: Force reject multi-transaction without nominal
    if (parsed.transaksi && Array.isArray(parsed.transaksi) && parsed.transaksi.length > 1) {
      const hasMissingNominal = parsed.transaksi.some((tx: any) => !tx.nominal || tx.nominal <= 0)
      if (hasMissingNominal) {
        const txNames = parsed.transaksi.map((tx: any) => tx.keterangan).join(', ')
        console.log('Post-processing: Rejecting multi-transaction with missing nominal')
        return {
          status: 'ditolak',
          transaksi: [],
          pesan_balasan: `❌ Nominal tidak terdeteksi. Anda mengirim ${parsed.transaksi.length} transaksi (${txNames}) tapi ada nominal yang tidak disebutkan. Silakan input ulang dengan menyertakan nominal untuk setiap transaksi.`
        }
      }
    }
    
    const validated = validateParseResult(parsed)
    
    console.log('Validated result:', validated)
    return validated
  } catch (error: any) {
    console.error('Groq API error:', error)
    return mockParseFinancialChat(message, context)
  }
}

function mockParseFinancialChat(
  message: string,
  context: ParserContext
): ParseResult {
  const lowerMessage = message.toLowerCase()
  
  const profileKeywords = ['profile', 'profil', 'cek profile', 'lihat profile', 'detail profile', 'cek profil', 'lihat profil', 'detail profil', 'info profile', 'data saya', 'akun saya']
  const isCekProfile = profileKeywords.some(kw => lowerMessage.includes(kw))
  
  if (isCekProfile) {
    return {
      status: 'cek_profile',
      transaksi: [],
      pesan_balasan: 'Menampilkan profil Anda...',
    }
  }
  
  const saldoKeywords = ['cek saldo', 'lihat saldo', 'saldo berapa', 'berapa saldo', 'info saldo', 'total saldo', 'saldo dompet']
  const isCekSaldo = saldoKeywords.some(kw => lowerMessage.includes(kw))
  
  if (isCekSaldo) {
    return {
      status: 'cek_saldo',
      transaksi: [],
      pesan_balasan: 'Menampilkan saldo dompet...',
    }
  }
  
  const transactionSeparators = [' dan ', ',', ';', ' lalu ', ' terus ']
  let transactionCount = 1
  
  for (const sep of transactionSeparators) {
    if (message.includes(sep)) {
      transactionCount = message.split(sep).filter(s => s.trim()).length
      break
    }
  }
  
  const amountMatches = message.match(/(\d+(?:[.,]\d+)?)\s*(rb|k|jt|juta|ribu)?/gi)
  const nominalCount = amountMatches ? amountMatches.length : 0
  
  if (transactionCount > 1 && nominalCount < transactionCount) {
    const parts = message.split(/ dan |,|;| lalu | terus /).filter(s => s.trim())
    const txNames = parts.map(p => p.replace(/\d+(?:[.,]\d+)?\s*(rb|k|jt|juta|ribu)?/gi, '').trim()).slice(0, transactionCount).join(', ')
    
    return {
      status: 'ditolak',
      transaksi: [],
      pesan_balasan: `❌ Nominal tidak terdeteksi. Anda mengirim ${transactionCount} transaksi (${txNames}) tapi ada nominal yang tidak disebutkan. Silakan input ulang dengan menyertakan nominal untuk setiap transaksi.`
    }
  }
  
  const incomeKeywords = ['gaji', 'terima', 'masuk', 'bonus', 'komisi', 'affiliate', 'refund', 'cashback', 'pendapatan', 'penghasilan']
  const expenseKeywords = ['beli', 'belanja', 'bayar', 'makan', 'minum', 'transfer ke', 'kirim ke', 'topup', 'top up', 'nonton', 'beli']
  
  const isIncome = incomeKeywords.some(kw => lowerMessage.includes(kw))
  const isExpense = expenseKeywords.some(kw => lowerMessage.includes(kw))
  
  const walletMentioned = context.wallets.some(w => lowerMessage.includes(w.toLowerCase()))
  
  if (!isIncome && !isExpense) {
    return {
      status: 'ambigu',
      transaksi: [],
      pesan_balasan: 'Apakah ini pemasukan atau pengeluaran? Mohon perjelas dengan kata kunci seperti "gaji masuk" untuk pemasukan atau "beli" untuk pengeluaran.',
    }
  }

  const amountMatch = message.match(/(\d+(?:[.,]\d+)?)\s*(rb|k|jt|juta|ribu)?/i)
  let nominal: number | null = null
  
  if (amountMatch) {
    const value = parseFloat(amountMatch[1].replace(',', '.'))
    const unit = amountMatch[2]?.toLowerCase()
    
    if (unit === 'rb' || unit === 'k' || unit === 'ribu') {
      nominal = value * 1000
    } else if (unit === 'jt' || unit === 'juta') {
      nominal = value * 1000000
    } else {
      nominal = value
    }
  }
  
  let dompet: string | null = null
  if (walletMentioned) {
    dompet = context.wallets.find(w => lowerMessage.includes(w.toLowerCase())) || null
  }
  
  const needsWallet = !dompet
  const needsNominal = nominal === null
  
  let pesanBalasan = ''
  if (needsWallet) {
    const walletList = context.wallets.join(', ')
    pesanBalasan = `Mohon sebutkan dari dompet mana. Dompet tersedia: ${walletList}`
  } else if (needsNominal) {
    pesanBalasan = 'Berapa nominalnya?'
  }
  
  return {
    status: needsWallet || needsNominal ? 'kurang_data' : 'lengkap',
    transaksi: [{
      jenis: isIncome ? 'pemasukan' : 'pengeluaran',
      nominal,
      dompet,
      keterangan: message,
    }],
    pesan_balasan: pesanBalasan,
  }
}
