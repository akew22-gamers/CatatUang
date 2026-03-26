export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
      }
      groups: {
        Row: {
          id: number
          name: string
          created_by: string
          created_at: string
        }
      }
      group_members: {
        Row: {
          user_id: string
          group_id: number
          role: 'owner' | 'admin' | 'member'
          joined_at: string
        }
      }
      wallets: {
        Row: {
          id: number
          name: string
          group_id: number
          created_by: string
          created_at: string
          saldo: number | null
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          group_id: number | null
          is_default: boolean
          created_at: string
        }
      }
      transactions: {
        Row: {
          id: number
          type: 'income' | 'expense' | 'transfer'
          amount: number
          description: string
          transaction_date: string
          wallet_id: number | null
          from_wallet_id: number | null
          to_wallet_id: number | null
          created_by: string
          group_id: number
          created_at: string
          wallet_name: string | null
          telegram_user_id: string | null
        }
      }
      ai_confirmations: {
        Row: {
          id: string
          user_id: string
          group_id: number
          original_message: string
          parsed_data: Json
          status: 'pending' | 'confirmed' | 'rejected'
          expires_at: string
          created_at: string
        }
      }
    }
  }
}
