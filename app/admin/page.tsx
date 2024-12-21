'use client'

import PendingUsersList from '../components/admin/PendingUsersList'

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin-Bereich</h1>
      <PendingUsersList />
    </div>
  )
}

