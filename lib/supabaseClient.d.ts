import { SupabaseClient } from '@supabase/supabase-js'

interface ParsedProject {
  id: unknown
  display_name: string
  internal_name: string
  payment_model: string
  min_duration: number
  per_minute_rate: number
  per_call_rate: number
  round_up_minutes: boolean
  custom_rates: Array<{
    minDuration: number
    maxDuration: number
    rate: number
  }>
}

interface ParsedCall {
  id: unknown
  type: string
  name: string
  number: string
  formattedtime: string
  formattedduration: string
  info: string
  Duration: number
}

declare module './lib/supabaseClient' {
  export const supabase: SupabaseClient
  export function parseProjectRates(project: Record<string, unknown>): ParsedProject | null
  export function parseCallDuration(call: Record<string, unknown>): ParsedCall | null
  export function isAdmin(): Promise<boolean>
}

