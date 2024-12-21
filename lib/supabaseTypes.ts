import { SupabaseClient } from '@supabase/supabase-js'

declare global {
  let supabase: SupabaseClient
}

export {}

