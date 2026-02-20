"use client"

import Link from "next/link"

/**
 * CTA Final — Full-width gradient (navy to blue), demo button,
 * subtle background pattern (CSS grid dots)
 */
export function CtaSection() {
  return (
    <section
      id="contacto-demo"
      className="relative py-20 sm:py-24 md:py-28 overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #2563EB 100%)",
        }}
      />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2
          id="cta-heading"
          className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-6"
        >
          ¿Listo para transformar su clínica?
        </h2>
        <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto mb-10">
          Solicite una demo gratuita y conozca la plataforma en acción.
          Sin compromisos.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5"
            style={{ backgroundColor: "#10B981" }}
          >
            Solicitar demo gratuita
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-semibold border-2 border-white/30 text-white hover:bg-white/10 transition-all duration-200"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </section>
  )
}
