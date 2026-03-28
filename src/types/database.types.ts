export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_confirmations: {
        Row: {
          created_at: string
          expires_at: string
          group_id: number
          id: string
          original_message: string
          parsed_data: Json
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          group_id: number
          id?: string
          original_message: string
          parsed_data: Json
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          group_id?: number
          id?: string
          original_message?: string
          parsed_data?: Json
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      allowed_emails: {
        Row: {
          added_by: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_registered: boolean | null
          registered_at: string | null
          role: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_registered?: boolean | null
          registered_at?: string | null
          role?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_registered?: boolean | null
          registered_at?: string | null
          role?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          group_id: number | null
          id: number
          is_default: boolean
          name: string
        }
        Insert: {
          created_at?: string
          group_id?: number | null
          id?: never
          is_default?: boolean
          name: string
        }
        Update: {
          created_at?: string
          group_id?: number | null
          id?: never
          is_default?: boolean
          name?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          data: Json | null
          group_id: number
          id: number
          role: string
          sender_name: string | null
          sender_role: string | null
          transaction_status: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          data?: Json | null
          group_id: number
          id?: never
          role: string
          sender_name?: string | null
          sender_role?: string | null
          transaction_status?: string | null
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          data?: Json | null
          group_id?: number
          id?: never
          role?: string
          sender_name?: string | null
          sender_role?: string | null
          transaction_status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: never
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: never
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      telegram_users: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_name: string | null
          created_at: string
          created_by: string | null
          description: string
          from_wallet_id: number | null
          group_id: number
          id: number
          telegram_user_id: string | null
          to_wallet_id: number | null
          transaction_date: string
          type: string
          wallet_id: number | null
          wallet_name: string | null
        }
        Insert: {
          amount: number
          category_name?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          from_wallet_id?: number | null
          group_id: number
          id?: never
          telegram_user_id?: string | null
          to_wallet_id?: number | null
          transaction_date?: string
          type: string
          wallet_id?: number | null
          wallet_name?: string | null
        }
        Update: {
          amount?: number
          category_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          from_wallet_id?: number | null
          group_id?: number
          id?: never
          telegram_user_id?: string | null
          to_wallet_id?: number | null
          transaction_date?: string
          type?: string
          wallet_id?: number | null
          wallet_name?: string | null
        }
        Relationships: []
      }
      wallet_balance_history: {
        Row: {
          change_amount: number
          change_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: number
          new_balance: number
          previous_balance: number
          transaction_id: number | null
          wallet_id: number
        }
        Insert: {
          change_amount: number
          change_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: never
          new_balance: number
          previous_balance: number
          transaction_id?: number | null
          wallet_id: number
        }
        Update: {
          change_amount?: number
          change_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: never
          new_balance?: number
          previous_balance?: number
          transaction_id?: number | null
          wallet_id?: number
        }
        Relationships: []
      }
      wallets: {
        Row: {
          created_at: string
          created_by: string | null
          group_id: number
          id: number
          name: string
          saldo: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          group_id: number
          id?: never
          name: string
          saldo?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          group_id?: number
          id?: never
          name?: string
          saldo?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_wallet_balance: {
        Args: {
          p_amount: number
          p_change_type?: string
          p_description?: string
          p_new_balance: number
          p_transaction_id?: number
          p_user_id?: string
          p_wallet_id: number
        }
        Returns: undefined
      }
      check_email_whitelist: { Args: { event: Json }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const