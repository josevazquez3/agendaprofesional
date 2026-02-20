"use client"

import { Building2, Calendar, Shield, Star } from "lucide-react"

const stats = [
  {
    icon: Building2,
    value: "500+",
    label: "Clínicas activas",
  },
  {
    icon: Calendar,
    value: "50K+",
    label: "Turnos gestionados",
  },
  {
    icon: Shield,
    value: "99.9%",
    label: "Uptime garantizado",
  },
  {
    icon: Star,
    value: "4.9",
    unit: "★",
    label: "Satisfacción promedio",
  },
]

/**
 * Stats Section — 4 big numbers with icons, gradient numbers
 */
export function StatsSection() {
  return (
    <section
      className="py-16 sm:py-20 md:py-24"
      style={{ backgroundColor: "#F8FAFC" }}
      aria-labelledby="stats-heading"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className={`text-center relative overflow-visible ${
                  index < 3 ? "lg:border-r border-[#E2E8F0] lg:pr-8" : ""
                }`}
              >
                <div className="flex justify-center mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#EFF6FF" }}
                    aria-hidden
                  >
                    <Icon className="h-6 w-6" style={{ color: "#2563EB" }} strokeWidth={1.5} />
                  </div>
                </div>
                <div
                  className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#2563EB] to-[#10B981] mb-2 overflow-visible min-w-0 break-words"
                  style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
                >
                  <span className="inline-block">{stat.value}</span>
                  {stat.unit && (
                    <span className="text-[#2563EB]">{stat.unit}</span>
                  )}
                </div>
                <p className="text-sm font-medium" style={{ color: "#64748B" }}>
                  {stat.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
