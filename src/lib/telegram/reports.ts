import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export interface ReportSummary {
  period: string
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
  byWallet: Array<{ name: string; amount: number }>
}

export async function getTransactionReport(
  userId: string,
  days: number
): Promise<ReportSummary | null> {
  const now = new Date()
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  
  // Get transactions
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('telegram_user_id', userId)
    .gte('transaction_date', startDate.toISOString())
    .lte('transaction_date', now.toISOString())
    .order('transaction_date', { ascending: false })
  
  if (error || !transactions) {
    console.error('Report query error:', error)
    return null
  }
  
  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  
  const balance = totalIncome - totalExpense
  
  // Group by wallet
  const walletMap = new Map<string, number>()
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      if (t.wallet_name) {
        walletMap.set(
          t.wallet_name,
          (walletMap.get(t.wallet_name) || 0) + (t.amount || 0)
        )
      }
    })
  
  const byWallet = Array.from(walletMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5) // Top 5
  
  let periodLabel = ''
  if (days === 1) periodLabel = 'Hari Ini'
  else if (days === 7) periodLabel = 'Minggu Ini'
  else if (days === 30) periodLabel = 'Bulan Ini'
  else periodLabel = `${days} Hari Terakhir`
  
  return {
    period: periodLabel,
    totalIncome,
    totalExpense,
    balance,
    transactionCount: transactions.length,
    byWallet,
  }
}
