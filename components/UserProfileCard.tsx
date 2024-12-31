import { User, Mail, Shield } from 'lucide-react'
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
    <Card className="bg-white shadow-lg border-blue-100 overflow-hidden">
      <CardHeader className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 pb-6 pt-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-white shadow-md">
            <AvatarImage src={user.avatar_url} alt={user.full_name} />
            <AvatarFallback>
              <User className="h-8 w-8 text-blue-500" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xl font-bold text-blue-900 mb-0.5">{user.full_name}</CardTitle>
            <p className="text-sm font-medium text-blue-600">{user.company_name || 'Kein Unternehmen angegeben'}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-blue-500" />
              <p className="text-sm font-semibold text-gray-700">E-Mail</p>
            </div>
            <p className="text-sm text-gray-900 break-all">{user.email}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <p className="text-sm font-semibold text-gray-700">Rolle</p>
            </div>
            <Badge 
              variant={user.role === 'admin' ? "default" : "secondary"} 
              className="font-medium text-xs px-2 py-0.5"
            >
              {user.role === 'admin' ? 'Administrator' : 'Benutzer'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

