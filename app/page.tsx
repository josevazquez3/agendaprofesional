"use client"

import { PublicNavbar } from "@/components/layout/public-navbar"
import { PublicFooter } from "@/components/layout/public-footer"
import { HeroSection } from "@/components/landing/hero-section"
import { StatsSection } from "@/components/landing/stats-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { PricingSection } from "@/components/landing/pricing-section"

/**
 * Landing Page — Agenda Profesional
 * Premium healthcare SaaS: Zocdoc meets Linear meets Notion
 * Color palette: Navy #0F172A, Blue #2563EB, Emerald #10B981
 */
export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      <PublicNavbar />

      <main role="main">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
      </main>

      <PublicFooter />
    </div>
  )
}
