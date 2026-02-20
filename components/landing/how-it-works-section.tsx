"use client"

import { Settings, UserPlus, Calendar } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Configure su clínica",
    description: "Datos, consultorios y horarios en minutos.",
    icon: Settings,
  },
  {
    number: "02",
    title: "Agregue profesionales y pacientes",
    description: "Carga masiva o manual. Integración con obras sociales.",
    icon: UserPlus,
  },
  {
    number: "03",
    title: "Gestione turnos en tiempo real",
    description: "Agenda unificada, recordatorios y reportes.",
    icon: Calendar,
  },
]

/**
 * How It Works — Dark section, 3 steps with large faded numbers,
 * connected with dashed line on desktop
 */
export function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="py-16 sm:py-20 md:py-24"
      style={{ backgroundColor: "#0F172A" }}
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2
            id="how-it-works-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4"
          >
            Cómo funciona
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "#94A3B8" }}>
            Tres pasos para tener su clínica operativa
          </p>
        </div>

        <div className="relative">
          {/* Dashed connector — desktop only */}
          <div
            className="hidden lg:block absolute top-24 left-[16.66%] right-[16.66%] h-0.5 border-t-2 border-dashed border-white/20"
            aria-hidden
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="relative text-center lg:text-left">
                  {/* Large faded number behind */}
                  <span
                    className="absolute -top-4 left-1/2 lg:left-0 -translate-x-1/2 lg:translate-x-0 text-[120px] sm:text-[140px] font-bold leading-none select-none opacity-[0.07]"
                    style={{ color: "#fff" }}
                    aria-hidden
                  >
                    {step.number}
                  </span>

                  <div className="relative z-10">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto lg:mx-0 mb-6"
                      style={{ backgroundColor: "rgba(37, 99, 235, 0.2)" }}
                    >
                      <Icon className="h-7 w-7 text-[#2563EB]" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm" style={{ color: "#94A3B8", lineHeight: 1.6 }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
