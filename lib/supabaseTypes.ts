import { SupabaseClient } from '@supabase/supabase-js'

declare global {
  var supabase: SupabaseClient
}

export {}

