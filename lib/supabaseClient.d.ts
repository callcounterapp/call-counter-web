import { SupabaseClient } from '@supabase/supabase-js'

declare module '../../lib/supabaseClient' {
  export const supabase: SupabaseClient
}

