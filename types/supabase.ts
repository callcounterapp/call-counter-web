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
      projects: {
        Row: {
          id: string
          internal_name: string
          display_name: string
          payment_model: 'custom' | 'perMinute' | 'perCall'
          custom_rates: Json
          min_duration: number
          per_minute_rate: number
          per_call_rate: number
          round_up_minutes: boolean
          user_id: string
        }
        Insert: {
          id?: string
          internal_name: string
          display_name: string
          payment_model: 'custom' | 'perMinute' | 'perCall'
          custom_rates: Json
          min_duration: number
          per_minute_rate: number
          per_call_rate: number
          round_up_minutes: boolean
          user_id: string
        }
        Update: {
          id?: string
          internal_name?: string
          display_name?: string
          payment_model?: 'custom' | 'perMinute' | 'perCall'
          custom_rates?: Json
          min_duration?: number
          per_minute_rate?: number
          per_call_rate?: number
          round_up_minutes?: boolean
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

