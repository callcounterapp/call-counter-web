"use client"

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { PhoneCall, BarChart2, Clock, Users } from 'lucide-react'

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

export default function Home() {
  useEffect(() => {
    const elements = document.querySelectorAll('.fade-in')
    elements.forEach((el) => {
      el.classList.add('opacity-100', 'translate-y-0')
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
            <AnimatedText text="Willkommen bei Call Counter" />
          </h1>
          <div className="text-xl text-blue-200 max-w-2xl mx-auto">
            <AnimatedText 
              text="Optimieren Sie Ihre Anrufverwaltung mit unserer fortschrittlichen Plattform für präzise Auswertungen." 
              delay={1500}
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 fade-in opacity-0 transform translate-y-4 transition-all duration-800 ease-out" style={{ transitionDelay: '3000ms' }}>
          <FeatureCard
            icon={<PhoneCall className="h-8 w-8 text-blue-400" />}
            title="Anruferfassung"
            description="Erfassen Sie mühelos alle eingehenden und ausgehenden Anrufe mit detaillierten Informationen."
          />
          <FeatureCard
            icon={<BarChart2 className="h-8 w-8 text-blue-400" />}
            title="Leistungsanalyse"
            description="Gewinnen Sie wertvolle Einblicke in Ihre Anrufstatistiken."
          />
          <FeatureCard
            icon={<Clock className="h-8 w-8 text-blue-400" />}
            title="Zeitmanagement"
            description="Verbessern Sie Ihre Anrufverwaltung und maximieren Sie Ihre Produktivität."
          />
          <FeatureCard
            icon={<Users className="h-8 w-8 text-blue-400" />}
            title="Teamkollaboration"
            description="Fördern Sie die Zusammenarbeit mit gemeinsamen Dashboards und Berichten."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in opacity-0 transform translate-y-4 transition-all duration-800 ease-out" style={{ transitionDelay: '3500ms' }}>
          <Link href="/auth/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 text-lg">
              Jetzt anmelden
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 text-lg">
              Konto erstellen
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

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 shadow-xl border border-blue-300/20 hover:border-blue-300/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
      <div className="flex items-center mb-4">
        <div className="transition-transform duration-300 hover:rotate-360">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-white ml-3">{title}</h3>
      </div>
      <p className="text-blue-100">{description}</p>
    </div>
  )
}

