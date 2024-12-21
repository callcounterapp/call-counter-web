import { Metadata } from 'next'
import DashboardInhalt from './dashboard-inhalt'

export const metadata: Metadata = {
  title: 'Dashboard | Call Tracker',
  description: 'Verwalten Sie Ihre Anrufe und sehen Sie Statistiken',
}

export default function DashboardSeite() {
  return <DashboardInhalt />
}


