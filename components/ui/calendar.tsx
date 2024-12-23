import React from 'react'
import { Button } from "@/components/ui/button"

interface CalendarProps {
  mode: 'range'
  selected: { from: Date; to: Date } | undefined
  onSelect: (range: { from: Date; to: Date } | undefined) => void
  defaultMonth?: Date
  numberOfMonths?: number
}

export function Calendar({ selected, onSelect }: CalendarProps) {
  const handleSelectToday = () => {
    const today = new Date()
    onSelect({ from: today, to: today })
  }

  const handleSelectLastWeek = () => {
    const today = new Date()
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    onSelect({ from: lastWeek, to: today })
  }

  const handleSelectLastMonth = () => {
    const today = new Date()
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
    onSelect({ from: lastMonth, to: today })
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="space-y-2">
        <Button onClick={handleSelectToday} variant="outline" className="w-full">Today</Button>
        <Button onClick={handleSelectLastWeek} variant="outline" className="w-full">Last 7 days</Button>
        <Button onClick={handleSelectLastMonth} variant="outline" className="w-full">Last 30 days</Button>
      </div>
      {selected && (
        <div className="mt-4">
          <p>Selected range:</p>
          <p>From: {selected.from.toDateString()}</p>
          <p>To: {selected.to.toDateString()}</p>
        </div>
      )}
    </div>
  )
}

