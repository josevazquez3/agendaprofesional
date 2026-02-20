"use client"

import { Quote } from "lucide-react"

const testimonials = [
  {
    initials: "ML",
    quote: "Agenda Profesional transformó nuestra gestión. Pasamos de cuadernos a una plataforma que nos ahorra horas cada semana.",
    name: "María López",
    role: "Directora Administrativa",
    clinic: "Clínica San Martín, Buenos Aires",
    color: "#2563EB",
  },
  {
    initials: "JG",
    quote: "La historia clínica digital y los recordatorios redujeron las inasistencias en un 40%. Los pacientes valoran la modernidad.",
    name: "Dr. Juan García",
    role: "Médico clínico",
    clinic: "Consultorio Privado, Córdoba",
    color: "#10B981",
  },
  {
    initials: "AP",
    quote: "Soporte excelente y onboarding rápido. En dos días estábamos operativos. Recomendamos la plataforma a colegas.",
    name: "Ana Pérez",
    role: "Secretaria",
    clinic: "Centro Médico Norte",
    color: "#7C3AED",
  },
]

/**
 * Testimonials — 3 cards, avatar initials, quote, name, role, clinic
 */
export function TestimonialsSection() {
  return (
    <section
      className="py-16 sm:py-20 md:py-24"
      style={{ backgroundColor: "#F8FAFC" }}
      aria-labelledby="testimonials-heading"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2
            id="testimonials-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
            style={{ color: "#1E293B" }}
          >
            Lo que dicen nuestras clínicas
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: "#64748B" }}>
            Más de 500 clínicas confían en Agenda Profesional
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, i) => (
            <article
              key={i}
              className="relative p-6 lg:p-8 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
              style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
            >
              <Quote
                className="absolute top-6 right-6 h-8 w-8 opacity-10"
                style={{ color: t.color }}
                aria-hidden
              />
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm mb-4"
                style={{ backgroundColor: t.color }}
              >
                {t.initials}
              </div>
              <blockquote className="text-base mb-6" style={{ color: "#1E293B", lineHeight: 1.7 }}>
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div>
                <p className="font-semibold" style={{ color: "#1E293B" }}>
                  {t.name}
                </p>
                <p className="text-sm" style={{ color: "#64748B" }}>
                  {t.role}
                </p>
                <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
                  {t.clinic}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
