"use client"

import Link from "next/link"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Básico",
    price: "Desde $XX/mes",
    description: "Ideal para consultorios pequeños",
    features: [
      "Hasta 2 profesionales",
      "500 turnos/mes",
      "Historia clínica digital",
      "Soporte por email",
    ],
    cta: "Comenzar",
    popular: false,
    accent: false,
  },
  {
    name: "Profesional",
    price: "Desde $XX/mes",
    description: "Para clínicas en crecimiento",
    features: [
      "Hasta 10 profesionales",
      "Turnos ilimitados",
      "Reportes y analytics",
      "Obras sociales",
      "Soporte prioritario",
    ],
    cta: "Solicitar demo",
    popular: true,
    accent: true,
  },
  {
    name: "Enterprise",
    price: "Consulte",
    description: "Para redes y hospitales",
    features: [
      "Profesionales ilimitados",
      "Multi-sede",
      "API y integraciones",
      "SLA dedicado",
      "Onboarding personalizado",
    ],
    cta: "Contactar ventas",
    popular: false,
    accent: false,
  },
]

/**
 * Pricing Teaser — 3 plan cards, middle elevated with emerald border
 */
export function PricingSection() {
  return (
    <section
      id="planes"
      className="py-16 sm:py-20 md:py-24"
      style={{ backgroundColor: "#EFF6FF" }}
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2
            id="pricing-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
            style={{ color: "#1E293B" }}
          >
            Planes para cada etapa
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: "#64748B" }}>
            Escale con su clínica. Sin contratos ni sorpresas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 lg:p-8 transition-all duration-300 ${
                plan.popular
                  ? "border-[#10B981] shadow-lg shadow-emerald-500/10 -translate-y-1 lg:-translate-y-2"
                  : "border-[#E2E8F0] hover:border-[#2563EB]/40"
              }`}
            >
              {plan.popular && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: "#10B981" }}
                >
                  Más popular
                </span>
              )}
              <h3 className="text-xl font-semibold mb-1" style={{ color: "#1E293B" }}>
                {plan.name}
              </h3>
              <p className="text-sm mb-4" style={{ color: "#64748B" }}>
                {plan.description}
              </p>
              <p
                className={`text-2xl font-bold mb-6 ${
                  plan.accent ? "text-[#10B981]" : ""
                }`}
                style={plan.accent ? {} : { color: "#1E293B" }}
              >
                {plan.price}
              </p>
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm" style={{ color: "#64748B" }}>
                    <Check
                      className="h-5 w-5 flex-shrink-0 mt-0.5"
                      style={{ color: "#10B981" }}
                      strokeWidth={2.5}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.popular ? "#contacto-demo" : "/auth/register"}
                className={`inline-flex items-center justify-center w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  plan.accent
                    ? "bg-[#10B981] text-white hover:bg-[#059669] hover:shadow-lg hover:-translate-y-0.5"
                    : "border-2 border-[#E2E8F0] text-[#1E293B] hover:border-[#2563EB] hover:text-[#2563EB]"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
