import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getFirmaDaten(userId: string) {
  const { data, error } = await supabase
    .from('firma_daten')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No data found, return null instead of throwing an error
      console.log('No firma daten found for user:', userId)
      return null
    }
    console.error('Error fetching firma daten:', error.message, error.details, error.hint)
    return null
  }

  return data
}

export async function updateFirmaDaten(userId: string, firmaDaten: any) {
  const { data, error } = await supabase
    .from('firma_daten')
    .upsert({ user_id: userId, ...firmaDaten })
    .select()

  if (error) {
    console.error('Error updating firma daten:', error)
    return null
  }

  return data[0]
}

