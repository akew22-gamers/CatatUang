import Groq from 'groq-sdk'
import { buildPromptWithContext } from './prompts'
import { preprocessMessage, extractEmojis, extractContextFromEmojis } from './preprocessor'

const groqApiKey = process.env.GROQ_API_KEY
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null

const GROQ_MODEL = 'llama-3.1-8b-instant'

export interface ParsedTransaction {
  jenis: 'pemasukan' | 'pengeluaran'
  nominal: number | null
  kategori: string | 'Umum' | null
  dompet: string | null
  keterangan: string
}

export interface ParseResult {
  status: 'lengkap' | 'kurang_data' | 'ambigu' | 'tidak_relevan' | 'permintaan_laporan'
  transaksi: ParsedTransaction[]
  pesan_balasan: string
}

export interface ParserContext {
  categories: string[]
  wallets: string[]
  group_id?: number
}

function validateParseResult(result: any): ParseResult {
  const validStatuses = ['lengkap', 'kurang_data', 'ambigu', 'tidak_relevan', 'permintaan_laporan']
  
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid response format: not an object')
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
  
  for (const tx of result.transaksi) {
    if (!tx || typeof tx !== 'object') {
      throw new Error('Invalid transaction object')
    }
    
    if (!['pemasukan', 'pengeluaran'].includes(tx.jenis)) {
      throw new Error(`Invalid jenis: ${tx.jenis}`)
    }
    
    if (tx.nominal !== null && typeof tx.nominal !== 'number') {
      throw new Error(`Invalid nominal: ${tx.nominal}`)
    }
    
    if (typeof tx.keterangan !== 'string') {
      throw new Error('keterangan must be a string')
    }
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
    
    const systemPrompt = buildPromptWithContext(context.categories, context.wallets)
    
    const userMessage = emojiContext.length > 0
      ? `${preprocessedMessage}\n\nContext dari emoji: ${emojiContext.join(', ')}`
      : preprocessedMessage

    console.log('Preprocessed message:', preprocessedMessage)
    console.log('Emoji context:', emojiContext)
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
    
    const validated = validateParseResult(parsed)
    
    validated.transaksi = validated.transaksi.map(tx => ({
      ...tx,
      kategori: tx.kategori || 'Umum',
    }))

    console.log('Validated result:', validated)
    return validated
  } catch (error: any) {
    console.error('Groq API error:', error)
    
    if (error.name === 'JSONParseError') {
      console.error('Failed to parse JSON response')
    }
    
    return mockParseFinancialChat(message, context)
  }
}

function mockParseFinancialChat(
  message: string,
  context: ParserContext
): ParseResult {
  const lowerMessage = message.toLowerCase()
  
  const isIncome = lowerMessage.includes('gaji') || lowerMessage.includes('terima') || lowerMessage.includes('masuk')
  const isReport = lowerMessage.includes('rekap') || lowerMessage.includes('laporan') || lowerMessage.includes('berapa')
  const isGreeting = lowerMessage.includes('halo') || lowerMessage.includes('hai') || lowerMessage.includes('test')
  
  if (isGreeting) {
    return {
      status: 'tidak_relevan',
      transaksi: [],
      pesan_balasan: 'Halo! Saya CatatUang Bot. Contoh: Beli kopi 25rb dari GoPay',
    }
  }
  
  if (isReport) {
    return {
      status: 'permintaan_laporan',
      transaksi: [],
      pesan_balasan: 'Baik, saya akan rekap transaksi. (fitur akan segera hadir)',
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
  
  const walletList = context.wallets || ['Cash', 'BCA', 'GoPay']
  const detectedWallet = walletList.find(w => lowerMessage.includes(w.toLowerCase())) || null
  
  let kategori: string | null = 'Umum'
  if (lowerMessage.includes('makan') || lowerMessage.includes('kopi')) {
    kategori = 'Makanan'
  } else if (lowerMessage.includes('bensin') || lowerMessage.includes('transport')) {
    kategori = 'Transport'
  } else if (lowerMessage.includes('gaji')) {
    kategori = 'Gaji'
  }
  
  const needsWallet = !detectedWallet && (isIncome || !isReport)
  
  return {
    status: needsWallet || nominal === null ? 'kurang_data' : 'lengkap',
    transaksi: [{
      jenis: isIncome ? 'pemasukan' : 'pengeluaran',
      nominal,
      kategori,
      dompet: detectedWallet,
      keterangan: message,
    }],
    pesan_balasan: needsWallet 
      ? `Dari dompet mana ${isIncome ? 'pemasukan' : 'pengeluaran'} ini?`
      : nominal === null
        ? 'Berapa nominalnya?'
        : '',
  }
}
