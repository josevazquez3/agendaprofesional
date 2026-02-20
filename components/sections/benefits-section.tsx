"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Clock,
  Users,
  Bell,
  Shield,
  Calendar,
  Heart,
  Zap,
} from "lucide-react"

const benefits = [
  {
    icon: Clock,
    title: "Horarios flexibles",
    description:
      "Gestione turnos con disponibilidad amplia y adaptada a sus necesidades",
  },
  {
    icon: Users,
    title: "Múltiples especialidades",
    description:
      "Acceso a una amplia variedad de profesionales y especialidades médicas",
  },
  {
    icon: Bell,
    title: "Recordatorios automáticos",
    description:
      "Notificaciones inteligentes por WhatsApp y Email para nunca perder una cita",
  },
  {
    icon: Shield,
    title: "Seguridad de datos",
    description:
      "Protección avanzada de información médica con encriptación de nivel empresarial",
  },
]

const metrics = [
  {
    value: "+10.000",
    label: "turnos gestionados",
    icon: Calendar,
  },
  {
    value: "98%",
    label: "satisfacción de pacientes",
    icon: Heart,
  },
  {
    value: "+250",
    label: "profesionales activos",
    icon: Users,
  },
  {
    value: "24/7",
    label: "disponibilidad",
    icon: Zap,
  },
]

export function BenefitsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sectionEl = sectionRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
      }
    )

    if (sectionEl) {
      observer.observe(sectionEl)
    }

    return () => {
      if (sectionEl) {
        observer.unobserve(sectionEl)
      }
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-[#F8FAFC] relative overflow-hidden"
    >
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        {/* Título y subtítulo */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-2xl lg:text-3xl font-semibold text-[#0F172A] mb-4 font-inter">
            Una plataforma diseñada para optimizar su práctica médica
          </h2>
          <p className="text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Soluciones inteligentes que mejoran la eficiencia y la experiencia
            tanto para profesionales como para pacientes
          </p>
        </div>

        {/* Bloque Beneficios */}
        <div
          className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 transition-all duration-700 delay-100 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <Card
                key={index}
                className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out group"
              >
                <CardContent className="p-6">
                  {/* Icono en círculo */}
                  <div className="mb-4">
                    <div className="w-14 h-14 rounded-full bg-[#EFF6FF] flex items-center justify-center group-hover:bg-[#2563EB] group-hover:scale-110 transition-all duration-200 ease-out">
                      <Icon
                        className="h-7 w-7 text-[#2563EB] group-hover:text-white transition-colors duration-200 ease-out"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-[#0F172A] mb-2 font-inter">
                    {benefit.title}
                  </h3>
                  <p className="text-base text-[#64748B] leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bloque Métricas */}
        <div
          className={`transition-all duration-700 delay-200 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {metrics.map((metric, index) => {
              const Icon = metric.icon
              return (
                <div
                  key={index}
                  className="text-center group"
                >
                  {/* Icono decorativo */}
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center group-hover:bg-[#2563EB] transition-all duration-200 ease-out">
                      <Icon
                        className="h-6 w-6 text-[#2563EB] group-hover:text-white transition-colors duration-200 ease-out"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>

                  {/* Número grande */}
                  <div className="mb-2">
                    <span className="text-3xl lg:text-4xl font-bold text-[#2563EB] font-inter">
                      {metric.value}
                    </span>
                  </div>

                  {/* Texto descriptivo */}
                  <p className="text-sm text-[#64748B] font-medium">
                    {metric.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
