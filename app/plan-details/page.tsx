'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"

const PlanDetailsPage = () => {
  const searchParams = useSearchParams()
  const selectedPlan = searchParams.get('plan')

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">Plan Details: {selectedPlan}</CardTitle>
          <CardDescription>Vielen Dank für Ihr Interesse an unserem {selectedPlan} Plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Sie haben den {selectedPlan} Plan ausgewählt. Hier sind die nächsten Schritte:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Überprüfen Sie die Details Ihres ausgewählten Plans</li>
            <li>Füllen Sie das Anmeldeformular aus</li>
            <li>Wählen Sie Ihre Zahlungsmethode</li>
            <li>Bestätigen Sie Ihre Bestellung</li>
          </ol>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>Zurück zur Übersicht</Button>
          <Button>Weiter zur Anmeldung</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default PlanDetailsPage

