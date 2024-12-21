import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to parse project rates
export function parseProjectRates(project: Record<string, unknown>) {
  if (!project) return null;

  // Parse custom rates
  let customRates = [];
  try {
    if (typeof project.custom_rates === 'string') {
      customRates = JSON.parse(project.custom_rates);
    } else if (Array.isArray(project.custom_rates)) {
      customRates = project.custom_rates;
    }

    // Ensure rates are numbers
    customRates = customRates.map(rate => ({
      minDuration: Number(rate.minDuration || rate.minduration || 0),
      maxDuration: Number(rate.maxDuration || rate.maxduration || 0),
      rate: Number(rate.rate || 0)
    }));
  } catch (e) {
    console.error('Error parsing custom rates:', e);
    customRates = [];
  }

  // Keep the original property names from Supabase
  const parsed = {
    id: project.id,
    display_name: project.display_name || 'Unnamed Project',
    internal_name: project.internal_name || '',
    payment_model: project.payment_model || 'custom',
    min_duration: Number(project.min_duration || 0),
    per_minute_rate: Number(project.per_minute_rate || 0),
    per_call_rate: Number(project.per_call_rate || 0),
    round_up_minutes: Boolean(project.round_up_minutes),
    custom_rates: customRates
  };

  return parsed;
}

// Helper function to parse call duration
export function parseCallDuration(call: Record<string, unknown>) {
  if (!call) return null;

  // Parse duration from formattedduration (MM:SS format)
  let duration = 0;
  if (typeof call.formattedduration === 'string') {
    const [minutes, seconds] = call.formattedduration.split(':').map(Number);
    duration = (minutes * 60) + seconds;
  }

  // Convert all values to their proper types
  const parsed = {
    id: call.id,
    type: call.type || 'unknown',
    name: call.name || '',
    number: call.number || '',
    formattedtime: call.formattedtime || '',
    formattedduration: call.formattedduration || '',
    info: call.info || '',
    Duration: duration
  };

  return parsed;
}

// Function to check if the current user is an admin
export async function isAdmin() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  return data?.role === 'admin'
}

