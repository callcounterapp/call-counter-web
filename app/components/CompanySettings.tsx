'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import { Building } from 'lucide-react'

type CompanyData = {
  name: string
  street: string
  city: string
  zipCode: string
  phone: string
  email: string
  website: string
}

export default function CompanySettings() {
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    street: '',
    city: '',
    zipCode: '',
    phone: '',
    email: '',
    website: ''
  })
  const [savedData, setSavedData] = useState<CompanyData | null>(null)

  useEffect(() => {
    const savedData = localStorage.getItem('companyData')
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      setCompanyData(parsedData)
      setSavedData(parsedData)
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('companyData', JSON.stringify(companyData))
    setSavedData(companyData)
    alert('Firmendaten wurden gespeichert!')
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center text-primary">
          <Building className="mr-2" />
          Firmendaten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="company-name">Firmenname</Label>
          <Input
            id="company-name"
            value={companyData.name}
            onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
            placeholder="Ihre Firma GmbH"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="street">Straße und Hausnummer</Label>
          <Input
            id="street"
            value={companyData.street}
            onChange={(e) => setCompanyData({ ...companyData, street: e.target.value })}
            placeholder="Musterstraße 123"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zip">PLZ</Label>
            <Input
              id="zip"
              value={companyData.zipCode}
              onChange={(e) => setCompanyData({ ...companyData, zipCode: e.target.value })}
              placeholder="12345"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Stadt</Label>
            <Input
              id="city"
              value={companyData.city}
              onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
              placeholder="Musterstadt"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            value={companyData.phone}
            onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
            placeholder="+49 123 456789"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            value={companyData.email}
            onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
            placeholder="info@ihrefirma.de"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={companyData.website}
            onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
            placeholder="www.ihrefirma.de"
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          Firmendaten speichern
        </Button>
        {savedData && (
          <div className="mt-8 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Gespeicherte Firmendaten</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Firmenname</dt>
                <dd className="mt-1 text-sm text-gray-900">{savedData.name}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Straße</dt>
                <dd className="mt-1 text-sm text-gray-900">{savedData.street}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">PLZ</dt>
                <dd className="mt-1 text-sm text-gray-900">{savedData.zipCode}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Stadt</dt>
                <dd className="mt-1 text-sm text-gray-900">{savedData.city}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                <dd className="mt-1 text-sm text-gray-900">{savedData.phone}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
                <dd className="mt-1 text-sm text-gray-900">{savedData.email}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Website</dt>
                <dd className="mt-1 text-sm text-gray-900">{savedData.website}</dd>
              </div>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

