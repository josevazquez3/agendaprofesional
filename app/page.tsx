"use client"

import { PublicNavbar } from "@/components/layout/public-navbar"
import { PublicFooter } from "@/components/layout/public-footer"
import { HeroSection } from "@/components/sections/hero-section"
import { ServicesSection } from "@/components/sections/services-section"
import { BenefitsSection } from "@/components/sections/benefits-section"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PublicNavbar />

      <main>
        <HeroSection />
        <ServicesSection />
        <BenefitsSection />

        {/* Sección "Cómo funciona" */}
        <section
          id="como-funciona"
          className="py-12 sm:py-16 md:py-20 bg-white border-t border-[#E2E8F0]"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[#0F172A] mb-4 font-inter">
                Cómo Funciona
              </h2>
              <p className="text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
                Proceso simple y rápido para solicitar su turno médico
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4 transition-all duration-200 ease-out hover:scale-110">
                  <span className="text-2xl font-bold text-[#2563EB]">1</span>
                </div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2 font-inter">
                  Regístrese
                </h3>
                <p className="text-base text-[#64748B] leading-relaxed">
                  Cree su cuenta en menos de 2 minutos con sus datos básicos
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4 transition-all duration-200 ease-out hover:scale-110">
                  <span className="text-2xl font-bold text-[#2563EB]">2</span>
                </div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2 font-inter">
                  Seleccione su turno
                </h3>
                <p className="text-base text-[#64748B] leading-relaxed">
                  Elija el profesional, especialidad y horario que mejor se adapte
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4 transition-all duration-200 ease-out hover:scale-110">
                  <span className="text-2xl font-bold text-[#2563EB]">3</span>
                </div>
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2 font-inter">
                  Confirme
                </h3>
                <p className="text-base text-[#64748B] leading-relaxed">
                  Reciba confirmación inmediata y recordatorios automáticos
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sección Profesionales */}
        <section
          id="profesionales"
          className="py-12 sm:py-16 md:py-20 bg-[#F8FAFC]"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl lg:text-3xl font-semibold text-[#0F172A] mb-4 font-inter">
                Nuestros Profesionales
              </h2>
              <p className="text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
                Equipo de profesionales médicos altamente capacitados y certificados
              </p>
            </div>
          </div>
        </section>

        {/* Sección Contacto */}
        <section
          id="contacto"
          className="py-12 sm:py-16 md:py-20 bg-white border-t border-[#E2E8F0]"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl lg:text-3xl font-semibold text-[#0F172A] mb-4 font-inter">
                Contacto
              </h2>
              <p className="text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
                ¿Tiene alguna pregunta? Estamos aquí para ayudarle
              </p>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
