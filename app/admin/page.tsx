import { Metadata } from 'next'
import AdminContent from './admin-content'

export const metadata: Metadata = {
  title: 'Admin | Call Tracker',
  description: 'Verwalten Sie Benutzer und Einstellungen',
}

export default function AdminPage() {
  return <AdminContent />
}

