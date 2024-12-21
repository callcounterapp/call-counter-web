'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent } from "./ui/card"
import { User } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface UserProfile {
  full_name: string
  company_name: string
}

export default function UserInfo({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data)
      }
    }

    fetchProfile()
  }, [userId])

  if (!profile) return null

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="flex items-center p-2 space-x-2">
        <div className="bg-primary/10 p-1 rounded-full">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="text-sm">
          <div className="font-medium">{profile.full_name}</div>
          <div className="text-xs text-muted-foreground">{profile.company_name}</div>
        </div>
      </CardContent>
    </Card>
  )
}

