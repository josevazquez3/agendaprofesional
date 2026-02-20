"use client"

import { Calendar, FileText, Users, Heart, BarChart3, ArrowRight } from "lucide-react"
import Link from "next/link"

/**
 * Features Section — Bento grid layout
 * Large: Agenda Inteligente (2 cols)
 * Medium: Historia Clínica, Gestión Pacientes
 * Small: Obras Sociales, Reportes
 */
export function FeaturesSection() {
  return (
    <section
      id="funcionalidades"
      className="py-16 sm:py-20 md:py-24"
      style={{ backgroundColor: "#EFF6FF" }}
      aria-labelledby="features-heading"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider mb-4"
            style={{ backgroundColor: "#DBEAFE", color: "#2563EB" }}
          >
            PLATAFORMA COMPLETA
          </span>
          <h2
            id="features-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
            style={{ color: "#1E293B" }}
          >
            Todo lo que su clínica necesita, en un solo lugar
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: "#64748B" }}>
            Módulos integrados para una gestión médica eficiente y moderna
          </p>
        </div>

        {/* Bento Grid — 4 cols: Agenda 2x2, 2 medium, 2 small */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 auto-rows-fr">
          {/* Large card: Agenda Inteligente — spans 2 cols, 2 rows */}
          <Link
            href="#contacto-demo"
            className="group lg:col-span-2 lg:row-span-2 block"
            aria-label="Conocer Agenda Inteligente"
          >
            <div
              className="h-full p-6 lg:p-8 rounded-2xl border border-[#E2E8F0] bg-white transition-all duration-300 hover:shadow-lg hover:border-[#2563EB]/40 hover:-translate-y-0.5"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: "#DBEAFE" }}
              >
                <Calendar className="h-7 w-7" style={{ color: "#2563EB" }} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: "#1E293B" }}>
                Agenda Inteligente
              </h3>
              <p className="mb-6" style={{ color: "#64748B", lineHeight: 1.6 }}>
                Turnos en tiempo real, disponibilidad por profesional y recordatorios
                automáticos. Minimice inasistencias y optimice la ocupación.
              </p>
              {/* Mini calendar CSS mockup */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] max-w-[200px]">
                <div className="grid grid-cols-7 gap-0.5 text-[10px] text-center font-medium" style={{ color: "#94A3B8" }}>
                  {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5 mt-2">
                  {Array.from({ length: 21 }).map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded flex items-center justify-center text-[10px] ${
                        i === 5 || i === 12
                          ? "bg-[#2563EB] text-white"
                          : "bg-white border border-[#E2E8F0]"
                      }`}
                      style={{ color: i === 5 || i === 12 ? undefined : "#64748B" }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-[#2563EB] group-hover:gap-2 transition-all">
                Conocer más <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          {/* Medium: Historia Clínica Digital */}
          <FeatureCard
            icon={FileText}
            title="Historia Clínica Digital"
            description="Historial completo, estudios adjuntos y trazabilidad. Todo centralizado y seguro."
            href="#contacto-demo"
          />

          {/* Medium: Gestión de Pacientes */}
          <FeatureCard
            icon={Users}
            title="Gestión de Pacientes"
            description="Fichas completas, obra social, contactos y seguimiento en un mismo lugar."
            href="#contacto-demo"
          />

          {/* Small: Obras Sociales */}
          <FeatureCard
            icon={Heart}
            title="Obras Sociales"
            description="Integración con códigos, precios y convenios."
            href="#contacto-demo"
            small
          />

          {/* Small: Reportes y Analytics */}
          <FeatureCard
            icon={BarChart3}
            title="Reportes y Analytics"
            description="Métricas, ocupación y tendencias."
            href="#contacto-demo"
            small
          />
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  small = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  description: string
  href: string
  small?: boolean
}) {
  return (
    <Link href={href} className="group block h-full" aria-label={`Conocer ${title}`}>
      <div className="h-full p-6 rounded-2xl border border-[#E2E8F0] bg-white transition-all duration-300 hover:shadow-lg hover:border-[#2563EB]/40 hover:-translate-y-0.5">
        <div
          className={`rounded-xl flex items-center justify-center mb-4 ${
            small ? "w-10 h-10" : "w-12 h-12"
          }`}
          style={{ backgroundColor: "#DBEAFE" }}
        >
          <Icon
            className={small ? "h-5 w-5" : "h-6 w-6"}
            style={{ color: "#2563EB" }}
            strokeWidth={1.5}
          />
        </div>
        <h3 className={`font-semibold mb-2 ${small ? "text-base" : "text-lg"}`} style={{ color: "#1E293B" }}>
          {title}
        </h3>
        <p className={`${small ? "text-sm" : "text-base"} mb-4`} style={{ color: "#64748B", lineHeight: 1.6 }}>
          {description}
        </p>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-[#2563EB] group-hover:gap-2 transition-all">
          Conocer más <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}
