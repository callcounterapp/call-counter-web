import { User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface UserProfileCardProps {
  user: {
    full_name: string
    email: string
    company_name: string
    role: string
    avatar_url?: string
  }
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <Card className="bg-white/95 shadow-2xl border-blue-200/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50 pb-8 pt-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
            <AvatarImage src={user.avatar_url} alt={user.full_name} />
            <AvatarFallback>
              <User className="h-10 w-10 text-blue-500" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl font-bold text-blue-900">{user.full_name}</CardTitle>
            <p className="text-sm font-medium text-blue-600">{user.company_name || 'Kein Unternehmen angegeben'}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-5 sm:p-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Rolle</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <Badge variant={user.role === 'admin' ? "default" : "secondary"} className="font-semibold">
                {user.role === 'admin' ? 'Administrator' : 'Benutzer'}
              </Badge>
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

