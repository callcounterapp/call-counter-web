'use client'

import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'

export function Navbar() {
  const { user, logout } = useAuth()

 
 
 
 

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Call Tracker
        </Link>
        <div className="space-x-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="ghost">Admin</Button>
                </Link>
              )}
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
            </>
          ) : (
            <Link href="/auth/login">
              <Button variant="outline">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

