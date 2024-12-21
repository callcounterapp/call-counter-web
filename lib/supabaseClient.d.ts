import { SupabaseClient } from '@supabase/supabase-js'

declare module '../lib/supabaseClient' {
  export const supabase: SupabaseClient
  export function parseProjectRates(project: Record<string, unknown>): any
  export function parseCallDuration(call: Record<string, unknown>): any
  export function isAdmin(): Promise<boolean>
}

