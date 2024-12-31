'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function verifyUserEmail(userId: string) {
  try {
    // Aktualisiere den Benutzer direkt mit der Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { 
        email_confirm: true,
        user_metadata: { verified: true }
      }
    )

    if (updateError) {
      console.error('Fehler bei der Benutzeraktualisierung:', updateError)
      return { success: false, error: updateError.message }
    }

    // Aktualisiere den Status in der profiles Tabelle
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Fehler beim Aktualisieren des Profils:', profileError)
      return { success: false, error: profileError.message }
    }

    // Bestätige die erfolgreiche Aktualisierung
    const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(userId)
    
    if (getUserError) {
      console.error('Fehler beim Abrufen des aktualisierten Benutzers:', getUserError)
    } else {
      console.log('Aktualisierter Benutzerstatus:', userData)
    }

    return { success: true }
  } catch (error) {
    console.error('Unerwarteter Fehler:', error)
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' }
  }
}

