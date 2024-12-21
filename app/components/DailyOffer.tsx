import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import { Progress } from "./ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { PlusCircle, TrendingUp, Euro } from 'lucide-react'

type DailyData = {
  date: string;
  totalCalls: number;
  orders: number;
  dailyOffers: number;
}

export default function DailyOffer() {
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [newEntry, setNewEntry] = useState<DailyData>({
    date: new Date().toISOString().split('T')[0],
    totalCalls: 0,
    orders: 0,
    dailyOffers: 0
  })

  const addDailyEntry = () => {
    setDailyData([...dailyData, newEntry])
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      totalCalls: 0,
      orders: 0,
      dailyOffers: 0
    })
  }

  const calculateStats = () => {
    const totalCalls = dailyData.reduce((sum, day) => sum + day.totalCalls, 0)
    const totalOrders = dailyData.reduce((sum, day) => sum + day.orders, 0)
    const totalDailyOffers = dailyData.reduce((sum, day) => sum + day.dailyOffers, 0)
    const quota = totalOrders > 0 ? (totalDailyOffers / totalOrders) * 100 : 0
    const payment = totalOrders * 0.04

    return { totalCalls, totalOrders, totalDailyOffers, quota, payment }
  }

  const stats = calculateStats()

  const getQuotaColor = (quota: number) => {
    if (quota >= 9) return 'text-green-500'
    if (quota >= 7) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center text-primary">
            <TrendingUp className="mr-2" />
            Daily Offer Statistiken
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="totalCalls">Gesamtanrufe</Label>
              <Input
                id="totalCalls"
                type="number"
                value={newEntry.totalCalls}
                onChange={(e) => setNewEntry({...newEntry, totalCalls: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="orders">Bestellungen</Label>
              <Input
                id="orders"
                type="number"
                value={newEntry.orders}
                onChange={(e) => setNewEntry({...newEntry, orders: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="dailyOffers">Daily Offers</Label>
              <Input
                id="dailyOffers"
                type="number"
                value={newEntry.dailyOffers}
                onChange={(e) => setNewEntry({...newEntry, dailyOffers: parseInt(e.target.value)})}
              />
            </div>
          </div>
          <Button onClick={addDailyEntry} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" /> Tageseintrag hinzufügen
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Gesamtstatistik</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Gesamtanrufe</p>
                  <p className="text-2xl font-bold">{stats.totalCalls}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Bestellungen</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Daily Offers</p>
                  <p className="text-2xl font-bold">{stats.totalDailyOffers}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Daily Offer Quote</p>
                  <p className={`text-2xl font-bold ${getQuotaColor(stats.quota)}`}>
                    {stats.quota.toFixed(2)}%
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium">Fortschritt zum 9% Ziel</p>
                <Progress value={Math.min(stats.quota, 9) / 9 * 100} className="mt-2" />
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium">Zusätzliche Vergütung</p>
                <p className="text-2xl font-bold text-green-500">
                  <Euro className="inline-block mr-1" />
                  {stats.payment.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tägliche Einträge</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Anrufe</TableHead>
                    <TableHead>Bestellungen</TableHead>
                    <TableHead>Daily Offers</TableHead>
                    <TableHead>Quote</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyData.map((day, index) => (
                    <TableRow key={index}>
                      <TableCell>{day.date}</TableCell>
                      <TableCell>{day.totalCalls}</TableCell>
                      <TableCell>{day.orders}</TableCell>
                      <TableCell>{day.dailyOffers}</TableCell>
                      <TableCell className={getQuotaColor((day.dailyOffers / day.orders) * 100)}>
                        {((day.dailyOffers / day.orders) * 100).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}

