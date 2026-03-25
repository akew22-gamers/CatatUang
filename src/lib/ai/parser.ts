import Groq from 'groq-sdk'

const groqApiKey = process.env.GROQ_API_KEY

console.log('Groq API Key present:', !!groqApiKey)

const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null

const GROQ_MODEL = 'llama-3.1-8b-instant'
const OPENROUTER_MODEL = 'meta-llama/llama-3-8b-instruct'

console.log('Using Groq model:', GROQ_MODEL)
console.log('Using OpenRouter model:', OPENROUTER_MODEL)

const SYSTEM_PROMPT = `Anda adalah CatatUang AI, asisten parser transaksi keuangan untuk pengguna Indonesia.

TUGAS: Ekstrak informasi transaksi dari input bahasa natural (termasuk slang Indonesia).

JENIS TRANSAKSI YANG DIDUKUNG:
- "income" (pemasukan, pendapatan, gaji, bonus)
- "expense" (pengeluaran, belanja, bayar, beli)
- "transfer" (transfer antar dompet/rekening)

SCHEMA JSON OUTPUT:
{
  "type": "income" | "expense" | "transfer",
  "amount": number | null,
  "description": string,
  "wallet": string | null,
  "category": string | null,
  "from_wallet": string | null,
  "to_wallet": string | null,
  "date": string | null,
  "confidence": number,
  "missing_fields": string[],
  "clarification_needed": boolean
}

ATURAN PARSING:
1. Amount: Konversi "50rb" → 50000, "100k" → 100000, "1.5jt" → 1500000
2. Wallet: Deteksi nama dompet (gopay, ovo, dana, bca, mandiri, cash, tunal)
3. Category: Infer dari konteks (makan → Makanan, bensin → Transport)
4. Type: "beli/bayar" = expense, "terima/gaji" = income, "transfer" = transfer
5. Date: "kemarin" → ISO date, "hari ini" → today

HANDLE AMBIGUITY:
- Jika amount tidak jelas → amount: null, clarification_needed: true
- Jika type tidak jelas → type: "expense" (default), clarification_needed: true
- Jika wallet tidak disebut → wallet: null (akan pakai default "Cash")
- Jika category tidak disebut → category: "Umum"

CONTOH PARSING:

Input: "Beli makan siang 50rb pakai gopay"
Output: {
  "type": "expense",
  "amount": 50000,
  "description": "Beli makan siang",
  "wallet": "gopay",
  "category": "Makanan",
  "from_wallet": null,
  "to_wallet": null,
  "date": null,
  "confidence": 0.95,
  "missing_fields": [],
  "clarification_needed": false
}

Input: "Transfer 500ribu dari BCA ke GoPay"
Output: {
  "type": "transfer",
  "amount": 500000,
  "description": "Transfer dana",
  "wallet": null,
  "category": null,
  "from_wallet": "BCA",
  "to_wallet": "GoPay",
  "date": null,
  "confidence": 0.98,
  "missing_fields": [],
  "clarification_needed": false
}

Input: "Kemarin beli kopi"
Output: {
  "type": "expense",
  "amount": null,
  "description": "Beli kopi",
  "wallet": null,
  "category": "Makanan",
  "from_wallet": null,
  "to_wallet": null,
  "date": "2026-03-24",
  "confidence": 0.6,
  "missing_fields": ["amount"],
  "clarification_needed": true
}

Input: "Gaji masuk 15 juta"
Output: {
  "type": "income",
  "amount": 15000000,
  "description": "Gaji masuk",
  "wallet": null,
  "category": "Gaji",
  "from_wallet": null,
  "to_wallet": null,
  "date": null,
  "confidence": 0.97,
  "missing_fields": ["wallet"],
  "clarification_needed": false
}

BAHASA: Indonesian (formal + slang seperti "topup", "gopay", "ovo", "shopeepay", "qris")

OUTPUT: Hanya JSON valid, tanpa penjelasan tambahan.`

interface ParsedTransaction {
  type: 'income' | 'expense' | 'transfer'
  amount: number | null
  description: string
  wallet: string | null
  category: string | null
  from_wallet: string | null
  to_wallet: string | null
  date: string | null
  confidence: number
  missing_fields: string[]
  clarification_needed: boolean
}

interface ParseResult {
  success: boolean
  data?: ParsedTransaction
  error?: string
}

export async function parseTransaction(message: string): Promise<ParseResult> {
  console.log('Parsing message:', message)
  
  if (!groq) {
    console.error('Groq client not initialized - API key missing')
    return mockParseTransaction(message)
  }
  
  try {
    console.log('Calling Groq API with model:', GROQ_MODEL)
    
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL, // FREE: llama-3.1-8b-instant
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1024,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return {
        success: false,
        error: 'Empty response from Groq API',
      }
    }

    const parsed = JSON.parse(content) as ParsedTransaction

    // Validate required fields
    if (!parsed.type || !['income', 'expense', 'transfer'].includes(parsed.type)) {
      return {
        success: false,
        error: 'Invalid transaction type',
      }
    }

    return {
      success: true,
      data: parsed,
    }
  } catch (error: any) {
    console.error('Groq API error:', error)
    
    // Fallback to mock parsing for development
    if (process.env.NODE_ENV === 'development') {
      return mockParseTransaction(message)
    }

    return {
      success: false,
      error: error.message || 'Failed to parse transaction',
    }
  }
}

// Mock parser for development/fallback
function mockParseTransaction(message: string): ParseResult {
  const lowerMessage = message.toLowerCase()
  
  let type: 'income' | 'expense' | 'transfer' = 'expense'
  if (lowerMessage.includes('gaji') || lowerMessage.includes('terima') || lowerMessage.includes('income')) {
    type = 'income'
  } else if (lowerMessage.includes('transfer') || lowerMessage.includes('kirim')) {
    type = 'transfer'
  }

  // Extract amount (simple regex for rb/k/jt)
  const amountMatch = message.match(/(\d+(?:[.,]\d+)?)\s*(rb|k|jt|juta|ribu)?/i)
  let amount: number | null = null
  if (amountMatch) {
    const value = parseFloat(amountMatch[1].replace(',', '.'))
    const unit = amountMatch[2]?.toLowerCase()
    if (unit === 'rb' || unit === 'k') {
      amount = value * 1000
    } else if (unit === 'jt' || unit === 'juta') {
      amount = value * 1000000
    } else if (unit === 'ribu') {
      amount = value * 1000
    } else {
      amount = value
    }
  }

  // Detect wallet
  let wallet: string | null = null
  if (lowerMessage.includes('gopay')) wallet = 'GoPay'
  else if (lowerMessage.includes('ovo')) wallet = 'OVO'
  else if (lowerMessage.includes('dana')) wallet = 'Dana'
  else if (lowerMessage.includes('shopee')) wallet = 'ShopeePay'
  else if (lowerMessage.includes('bca')) wallet = 'BCA'
  else if (lowerMessage.includes('mandiri')) wallet = 'Mandiri'
  else if (lowerMessage.includes('bni')) wallet = 'BNI'
  else if (lowerMessage.includes('bri')) wallet = 'BRI'
  else if (lowerMessage.includes('cash') || lowerMessage.includes('tunai')) wallet = 'Cash'

  // Detect category from context
  let category: string | null = 'Umum'
  if (lowerMessage.includes('makan') || lowerMessage.includes('kopi') || lowerMessage.includes('lunch') || lowerMessage.includes('dinner')) {
    category = 'Makanan'
  } else if (lowerMessage.includes('bensin') || lowerMessage.includes('transport') || lowerMessage.includes('ojek') || lowerMessage.includes('grab')) {
    category = 'Transport'
  } else if (lowerMessage.includes('belanja') || lowerMessage.includes('shop')) {
    category = 'Belanja'
  } else if (lowerMessage.includes('gaji')) {
    category = 'Gaji'
  }

  return {
    success: true,
    data: {
      type,
      amount,
      description: message,
      wallet,
      category,
      from_wallet: null,
      to_wallet: null,
      date: null,
      confidence: 0.7,
      missing_fields: amount ? [] : ['amount'],
      clarification_needed: !amount,
    },
  }
}
