"use client"

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { CheckCircle } from 'lucide-react'

const AnimatedText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const words = container.children
    Array.from(words).forEach((word, index) => {
      setTimeout(() => {
        (word as HTMLElement).style.opacity = '1'
        ;(word as HTMLElement).style.transform = 'translateY(0)'
      }, delay + index * 120)
    })
  }, [delay])

  return (
    <div ref={containerRef} className="overflow-hidden flex flex-wrap">
      {text.split(' ').map((word, index) => (
        <span
          key={index}
          className="inline-block mr-1 opacity-0 transform translate-y-4 transition-all duration-300 ease-out"
          style={{ transitionDelay: `${delay + index * 120}ms` }}
        >
          {word}
        </span>
      ))}
    </div>
  )
}

export default function EmailConfirmationPage() {
  useEffect(() => {
    const elements = document.querySelectorAll('.fade-in')
    elements.forEach((el) => {
      el.classList.add('opacity-100', 'translate-y-0')
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
            <AnimatedText text="E-Mail-Adresse bestätigt" />
          </h1>
          <div className="text-xl text-blue-200 max-w-2xl mx-auto">
            <AnimatedText 
              text="Vielen Dank für die Bestätigung Ihrer E-Mail-Adresse." 
              delay={1500}
            />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 shadow-xl border border-blue-300/20 max-w-md w-full mb-8 fade-in opacity-0 transform translate-y-4 transition-all duration-800 ease-out" style={{ transitionDelay: '3000ms' }}>
          <div className="flex items-center justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-400" />
          </div>
          <p className="text-blue-100 mb-6 text-center">
            Ihr Konto wurde erfolgreich verifiziert. Ein Administrator wird Ihr Konto in Kürze freischalten.
            Sie erhalten eine Benachrichtigung, sobald Sie sich anmelden können.
          </p>
          <Link href="/">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 text-lg">
              Zur Startseite
            </Button>
          </Link>
        </div>

        <footer className="mt-16 text-center text-blue-300 text-sm fade-in opacity-0 transition-opacity duration-800 ease-out" style={{ transitionDelay: '4000ms' }}>
          © {new Date().getFullYear()} Jimmy Wilhelmer. Alle Rechte vorbehalten.
        </footer>
      </div>
    </div>
  )
}

