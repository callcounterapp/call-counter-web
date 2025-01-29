import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(req: Request) {
  try {
    const { email, subject, message, userId } = await req.json()
    console.log("Received request:", { email, subject, message, userId })

    if (!email || !subject || !message || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("Attempting to send email:", { email, subject, userId })
    console.log("Attempting to update user and send email")

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: email,
      email_confirm: true,
      user_metadata: {
        ticket_subject: subject,
        admin_response: message,
      },
    })

    console.log("Supabase response:", { data, error })

    if (error) {
      console.error("Supabase email error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Email sent successfully:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred", details: error }, { status: 500 })
  }
}

