'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Check } from 'lucide-react'

const PricingPage = () => {
  const [isMonthly, setIsMonthly] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const router = useRouter()

  const pricingPlans = [
    {
      name: 'Basic',
      monthlyPrice: '0,99 €',
      yearlyPrice: '99 €',
      description: 'Ideal für Einzelpersonen und kleine Teams',
      features: ['Grundlegende Anrufverfolgung', 'Einfache Berichterstellung', 'E-Mail-Support'],
    },
    {
      name: 'Plus',
      monthlyPrice: '4,99 €',
      yearlyPrice: '49,99 €',
      description: 'Perfekt für wachsende Unternehmen',
      features: ['Erweiterte Anrufanalyse', 'Benutzerdefinierte Berichte', 'Prioritäts-Support'],
      recommended: true,
    },
    {
      name: 'Business',
      monthlyPrice: '9,99 €',
      yearlyPrice: '99,99 €',
      description: 'Für große Unternehmen mit hohem Anrufvolumen',
      features: ['Unbegrenzte Anrufaufzeichnungen', 'API-Zugang', '24/7 Premium-Support'],
    },
  ]

  const fullAccessPlans = [
    {
      name: 'Basic Vollversion',
      price: '99 €',
      description: 'Einmaliger Kauf für unbegrenzten Zugriff',
      features: [
        'Lebenslanger Zugriff auf Basic-Funktionen',
        'Keine monatlichen Gebühren',
        'Kostenlose Updates für Basic-Version',
      ],
    },
    {
      name: 'Plus Vollversion',
      price: '199 €',
      description: 'Erweiterter Zugriff für wachsende Unternehmen',
      features: [
        'Alle Basic-Funktionen inklusive',
        'Erweiterte Anrufanalyse und Berichterstellung',
        'Prioritäts-Support',
      ],
    },
    {
      name: 'Business Vollversion',
      price: '499 €',
      description: 'Komplettlösung für große Unternehmen',
      features: [
        'Alle Plus-Funktionen inklusive',
        'Unbegrenzte Anrufaufzeichnungen',
        'API-Zugang und individuelle Anpassungen',
      ],
    },
  ]

  const handlePlanSelect = (planName: string) => {
    setSelectedPlan(planName)
  }

  const handleStartNow = () => {
    if (selectedPlan) {
      router.push(`/plan-details?plan=${encodeURIComponent(selectedPlan)}`)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-4">Wählen Sie Ihren Plan</h1>
      <p className="text-xl text-center text-gray-600 mb-8">
        Flexible Optionen für jede Unternehmensgröße
      </p>

      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-full">
          <Button
            variant={isMonthly ? "default" : "ghost"}
            onClick={() => setIsMonthly(true)}
          >
            Monatlich
          </Button>
          <Button
            variant={!isMonthly ? "default" : "ghost"}
            onClick={() => setIsMonthly(false)}
          >
            Jährlich
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {pricingPlans.map((plan) => (
          <Card 
            key={plan.name} 
            className={`flex flex-col cursor-pointer ${
              selectedPlan === plan.name ? 'border-blue-500 border-2' : ''
            }`}
            onClick={() => handlePlanSelect(plan.name)}
          >
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="text-4xl font-bold mb-4">
                {isMonthly ? plan.monthlyPrice : plan.yearlyPrice}
                <span className="text-lg font-normal">
                  {isMonthly ? ' / Monat' : ' / Jahr'}
                </span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant={plan.recommended ? "default" : "outline"} onClick={handleStartNow}>
                Jetzt starten
              </Button>
            </CardFooter>
            <Badge className="absolute top-0 right-0 m-2" variant="default">
                Empfohlen
              </Badge>
          </Card>
        ))}
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-bold text-center mb-8">Vollzugriff - Einmaliger Kauf</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {fullAccessPlans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`flex flex-col cursor-pointer ${
                selectedPlan === plan.name ? 'border-blue-500 border-2' : ''
              }`}
              onClick={() => handlePlanSelect(plan.name)}
            >
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-4xl font-bold mb-4">{plan.price}</div>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleStartNow}>Jetzt kaufen</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PricingPage

