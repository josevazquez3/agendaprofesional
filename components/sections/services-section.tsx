"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  Stethoscope,
  Calendar,
  FileText,
  Users,
  Clock,
  Shield,
  Bell,
} from "lucide-react"

const services = [
  {
    icon: Stethoscope,
    title: "Atención Profesional",
    description:
      "Profesionales médicos altamente capacitados y certificados para brindar la mejor atención.",
    color: "from-[#2563EB] to-[#1E40AF]",
  },
  {
    icon: Calendar,
    title: "Turnos Online",
    description:
      "Reserve su turno las 24 horas del día desde cualquier dispositivo, de forma rápida y sencilla.",
    color: "from-[#0EA5A4] to-[#0D9488]",
  },
  {
    icon: FileText,
    title: "Historia Clínica Digital",
    description:
      "Acceda a su historial médico completo desde cualquier lugar de forma segura y confidencial.",
    color: "from-[#7C3AED] to-[#6D28D9]",
  },
]

const benefits = [
  {
    icon: Clock,
    title: "Horarios flexibles",
    description: "Disponibilidad amplia de horarios",
  },
  {
    icon: Users,
    title: "Múltiples especialidades",
    description: "Variedad de profesionales y especialidades",
  },
  {
    icon: Shield,
    title: "Datos seguros",
    description: "Protección de información médica",
  },
  {
    icon: Bell,
    title: "Recordatorios automáticos",
    description: "Notificaciones por WhatsApp y Email",
  },
]

export function ServicesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        {/* Cards de servicios principales */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2
              id="especialidades"
              className="text-2xl lg:text-3xl font-semibold text-[#0F172A] mb-4 font-inter"
            >
              Nuestros Servicios
            </h2>
            <p className="text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
              Soluciones integrales para la gestión médica moderna
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <Card
                  key={index}
                  className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out group"
                >
                  <CardContent className="p-8">
                    {/* Icono en contenedor circular */}
                    <div className="mb-6">
                      <div
                        className={`w-16 h-16 rounded-full bg-gradient-to-br ${service.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="h-8 w-8 text-white" strokeWidth={1.5} />
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-[#0F172A] mb-3 font-inter">
                      {service.title}
                    </h3>
                    <p className="text-base text-[#64748B] leading-relaxed">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Sección de beneficios */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-semibold text-[#0F172A] mb-4 font-inter">
              Beneficios
            </h2>
            <p className="text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
              Todo lo que necesita para una gestión médica eficiente
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <Card
                  key={index}
                  className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                          <Icon className="h-6 w-6 text-[#2563EB]" strokeWidth={1.5} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#0F172A] mb-1 font-inter">
                          {benefit.title}
                        </h3>
                        <p className="text-sm text-[#64748B]">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
