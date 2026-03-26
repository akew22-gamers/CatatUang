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
  category_needs_selection?: boolean
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

function normalizeAndValidateCategory(
  aiPickedCategory: string | null,
  availableCategories: string[]
): { category: string; needsSelection: boolean } {
  if (!aiPickedCategory || aiPickedCategory.trim() === '') {
    return { category: 'Umum', needsSelection: false }
  }
  
  const hasOnlyUmum = availableCategories.length === 1 && 
                     availableCategories[0].toLowerCase() === 'umum'
  
  if (hasOnlyUmum) {
    return { category: 'Umum', needsSelection: false }
  }
  
  const normalizedCategories = availableCategories.map(c => c.toLowerCase().trim())
  const normalizedAiCategory = aiPickedCategory.toLowerCase().trim()
  
  const categoryIndex = normalizedCategories.indexOf(normalizedAiCategory)
  
  if (categoryIndex !== -1) {
    return { 
      category: availableCategories[categoryIndex], 
      needsSelection: false 
    }
  }
  
  const similarCategory = normalizedCategories.find(c => 
    c.includes(normalizedAiCategory) || normalizedAiCategory.includes(c)
  )
  
  if (similarCategory) {
    const index = normalizedCategories.indexOf(similarCategory)
    return { 
      category: availableCategories[index], 
      needsSelection: false 
    }
  }
  
  return { category: 'Umum', needsSelection: true }
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
    
    validated.transaksi = validated.transaksi.map(tx => {
      const { category, needsSelection } = normalizeAndValidateCategory(
        tx.kategori,
        context.categories
      )
      
      return {
        ...tx,
        kategori: category,
        category_needs_selection: needsSelection,
      }
    })

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
  
  const isIncome = lowerMessage.includes('gaji') || lowerMessage.includes('terima') || 
                   lowerMessage.includes('masuk') || lowerMessage.includes('affiliate')
  const isReport = lowerMessage.includes('rekap') || lowerMessage.includes('laporan') || 
                   lowerMessage.includes('berapa')
  const isGreeting = lowerMessage.includes('halo') || lowerMessage.includes('hai') || 
                     lowerMessage.includes('test')
  
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
  
  let kategori: string | null = 'Umum'
  if (lowerMessage.includes('makan') || lowerMessage.includes('kopi') || 
      lowerMessage.includes('bakso') || lowerMessage.includes('jajan') ||
      lowerMessage.includes('cireng')) {
    kategori = 'Makanan'
  } else if (lowerMessage.includes('bensin') || lowerMessage.includes('transport') || 
             lowerMessage.includes('ojek') || lowerMessage.includes('grab')) {
    kategori = 'Transport'
  } else if (lowerMessage.includes('gaji') || lowerMessage.includes('affiliate') || 
             lowerMessage.includes('bonus') || lowerMessage.includes('komisi')) {
    kategori = 'Gaji'
  } else if (lowerMessage.includes('skincare') || lowerMessage.includes('kosmetik') || 
             lowerMessage.includes('kecantikan')) {
    kategori = 'Kecantikan'
  } else if (lowerMessage.includes('batr') || lowerMessage.includes('elektronik') || 
             lowerMessage.includes('gadget')) {
    kategori = 'Elektronik'
  }
  
  const { category, needsSelection } = normalizeAndValidateCategory(kategori, context.categories)
  kategori = category
  
  const needsWallet = true
  const needsNominal = nominal === null
  
  let pesanBalasan = ''
  if (needsWallet) {
    pesanBalasan = `Dari dompet mana ${isIncome ? 'pemasukan' : 'pengeluaran'} ini?`
  } else if (needsNominal) {
    pesanBalasan = 'Berapa nominalnya?'
  }
  
  if (needsSelection && context.categories.length > 1) {
    const catList = context.categories.filter(c => c !== 'Umum').join(', ')
    if (pesanBalasan) {
      pesanBalasan += ` Kategori tersedia: ${catList}`
    } else {
      pesanBalasan = `Kategori tersedia: ${catList}`
    }
    if (pesanBalasan) {
      pesanBalasan += '.'
    }
  }
  
  return {
    status: needsWallet || needsNominal ? 'kurang_data' : 'lengkap',
    transaksi: [{
      jenis: isIncome ? 'pemasukan' : 'pengeluaran',
      nominal,
      kategori,
      dompet: null,
      keterangan: message,
      category_needs_selection: needsSelection,
    }],
    pesan_balasan: pesanBalasan,
  }
}
