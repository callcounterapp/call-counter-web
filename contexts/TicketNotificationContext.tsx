"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "./AuthContext"
import { usePathname } from "next/navigation"

interface TicketNotificationContextType {
  hasTicketUpdates: boolean
  setHasTicketUpdates: React.Dispatch<React.SetStateAction<boolean>>
  resetNotification: () => void
  checkTicketUpdates: () => Promise<void>
}

const TicketNotificationContext = createContext<TicketNotificationContextType | undefined>(undefined)

export const useTicketNotification = () => {
  const context = useContext(TicketNotificationContext)
  if (context === undefined) {
    throw new Error("useTicketNotification must be used within a TicketNotificationProvider")
  }
  return context
}

export const TicketNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasTicketUpdates, setHasTicketUpdates] = useState(false)
  const { user } = useAuth()
  const supabase = createClientComponentClient()
  const pathname = usePathname()

  const checkTicketUpdates = async () => {
    if (!user) return

    try {
      const { data: tickets, error } = await supabase
        .from("support_tickets")
        .select("status, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("Supabase error:", error.message, error.details, error.hint)
        return
      }

      if (tickets && tickets.length > 0) {
        const lastChecked = localStorage.getItem("lastTicketCheck")
        const hasNewUpdates = !lastChecked || new Date(tickets[0].updated_at) > new Date(lastChecked)
        setHasTicketUpdates(hasNewUpdates)
      }
    } catch (error) {
      console.error("Fehler beim Prüfen der Ticket-Updates:", error)
    }
  }

  useEffect(() => {
    checkTicketUpdates()
  }, [user, pathname, checkTicketUpdates]) // Added checkTicketUpdates to dependencies

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("ticket-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "support_tickets",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          setHasTicketUpdates(true)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  const resetNotification = () => {
    setHasTicketUpdates(false)
    localStorage.setItem("lastTicketCheck", new Date().toISOString())
  }

  return (
    <TicketNotificationContext.Provider
      value={{ hasTicketUpdates, setHasTicketUpdates, resetNotification, checkTicketUpdates }}
    >
      {children}
    </TicketNotificationContext.Provider>
  )
}

