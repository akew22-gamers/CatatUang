import Groq from 'groq-sdk'

const groqApiKey = process.env.GROQ_API_KEY
console.log('Groq API Key present:', !!groqApiKey)

const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null

const GROQ_MODEL = 'llama-3.1-8b-instant'
const OPENROUTER_MODEL = 'meta-llama/llama-3-8b-instruct'

console.log('Using Groq model:', GROQ_MODEL)

interface ParseOptions {
  categories?: string[]
  wallets?: string[]
}

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
  suggested_categories?: string[]
  suggested_wallets?: string[]
}

interface ParseResult {
  success: boolean
  data?: ParsedTransaction
  error?: string
}

function buildSystemPrompt(categories: string[], wallets: string[]) {
  const categoryList = categories.length > 0 ? categories.join(', ') : 'Umum'
  const walletList = wallets.length > 0 ? wallets.join(', ') : 'Cash, BCA, GoPay, OVO'

  return `Anda adalah CatatUang AI, asisten parser transaksi keuangan untuk pengguna Indonesia.

TUGAS: Ekstrak informasi transaksi dari input bahasa natural (termasuk slang Indonesia).

KATEGORI YANG TERSEDIA DI DATABASE:
${categoryList}

DOMPET YANG TERSEDIA DI DATABASE:
${walletList}

PENTING - PRIORITAS PENGGUNAAN:
1. PRIORITASKAN kategori yang ADA di database. Jika user menyebut kategori yang tidak ada, gunakan kategori yang paling mirip dari database.
2. PRIORITASKAN dompet yang ADA di database. Jika user menyebut dompet yang tidak ada, gunakan dompet yang paling mirip dari database.
3. Jika kategori TIDAK ADA di database sama sekali, set category ke "Umum" dan tambahkan suggested_categories dengan kategori yang user maksud.
4. Jika dompet TIDAK ADA di database, set wallet ke null dan tambahkan suggested_wallets. User akan diminta memilih.

JENIS TRANSAKSI:
- "income" (pemasukan, gaji, bonus, terima)
- "expense" (pengeluaran, belanja, bayar, beli)
- "transfer" (transfer antar dompet)

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
  "clarification_needed": boolean,
  "suggested_categories": string[] | null,
  "suggested_wallets": string[] | null
}

ATURAN KHUSUS:
1. Jika user TIDAK SEBUT dompet untuk expense → set wallet: null, clarification_needed: true, suggested_wallets: [list dompet yang ada]
2. Jika user SEBUT kategori yang TIDAK ADA → set category: "Umum", suggested_categories: [kategori yang user maksud]
3. Jika amount tidak jelas → amount: null, clarification_needed: true
4. Gunakan konteks Indonesia: "gopay" → "GoPay", "bca" → "BCA", dll

CONTOH:

Input: "Beli makan siang 50rb pakai gopay"
Database categories: ["Umum", "Makanan", "Transport"]
Database wallets: ["Cash", "BCA", "GoPay"]
Output: {
  "type": "expense",
  "amount": 50000,
  "description": "Beli makan siang",
  "wallet": "GoPay",
  "category": "Makanan",
  "confidence": 0.95,
  "missing_fields": [],
  "clarification_needed": false,
  "suggested_categories": null,
  "suggested_wallets": null
}

Input: "Beli kopi 25rb" (tidak sebut dompet)
Database wallets: ["Cash", "BCA", "GoPay"]
Output: {
  "type": "expense",
  "amount": 25000,
  "description": "Beli kopi",
  "wallet": null,
  "category": "Makanan",
  "confidence": 0.9,
  "missing_fields": ["wallet"],
  "clarification_needed": true,
  "suggested_categories": null,
  "suggested_wallets": ["Cash", "BCA", "GoPay"]
}

Input: "Beli buku 100rb kategori Pendidikan" (kategori tidak ada di DB)
Database categories: ["Umum", "Makanan", "Transport"]
Output: {
  "type": "expense",
  "amount": 100000,
  "description": "Beli buku",
  "wallet": null,
  "category": "Umum",
  "confidence": 0.8,
  "missing_fields": ["wallet"],
  "clarification_needed": true,
  "suggested_categories": ["Pendidikan"],
  "suggested_wallets": ["Cash", "BCA", "GoPay"]
}

BAHASA: Indonesian (formal + slang)
OUTPUT: Hanya JSON valid, tanpa penjelasan.`
}

export async function parseTransaction(
  message: string,
  options?: ParseOptions
): Promise<ParseResult> {
  console.log('Parsing message:', message)
  console.log('Context - Categories:', options?.categories || [], 'Wallets:', options?.wallets || [])
  
  if (!groq) {
    console.error('Groq client not initialized')
    return mockParseTransaction(message, options)
  }
  
  try {
    const systemPrompt = buildSystemPrompt(options?.categories || [], options?.wallets || [])
    
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1024,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return { success: false, error: 'Empty response from Groq API' }
    }

    const parsed = JSON.parse(content) as ParsedTransaction

    if (!parsed.type || !['income', 'expense', 'transfer'].includes(parsed.type)) {
      return { success: false, error: 'Invalid transaction type' }
    }

    console.log('Parsed result:', parsed)
    return { success: true, data: parsed }
  } catch (error: any) {
    console.error('Groq API error:', error)
    return { success: false, error: error.message }
  }
}

function mockParseTransaction(
  message: string,
  options?: ParseOptions
): ParseResult {
  const lowerMessage = message.toLowerCase()
  
  let type: 'income' | 'expense' | 'transfer' = 'expense'
  if (lowerMessage.includes('gaji') || lowerMessage.includes('terima')) {
    type = 'income'
  } else if (lowerMessage.includes('transfer') || lowerMessage.includes('kirim')) {
    type = 'transfer'
  }

  const amountMatch = message.match(/(\d+(?:[.,]\d+)?)\s*(rb|k|jt|juta|ribu)?/i)
  let amount: number | null = null
  if (amountMatch) {
    const value = parseFloat(amountMatch[1].replace(',', '.'))
    const unit = amountMatch[2]?.toLowerCase()
    if (unit === 'rb' || unit === 'k') amount = value * 1000
    else if (unit === 'jt' || unit === 'juta') amount = value * 1000000
    else amount = value
  }

  const walletList = options?.wallets || ['Cash', 'BCA', 'GoPay']
  
  return {
    success: true,
    data: {
      type,
      amount,
      description: message,
      wallet: null,
      category: options?.categories?.[0] || 'Umum',
      from_wallet: null,
      to_wallet: null,
      date: null,
      confidence: 0.5,
      missing_fields: amount ? [] : ['amount'],
      clarification_needed: !amount || !options?.wallets?.length,
      suggested_categories: null,
      suggested_wallets: walletList,
    },
  }
}
