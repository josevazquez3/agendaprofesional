"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"

export function HeroSection() {
  return (
    <section
      id="inicio"
      className="pt-24 sm:pt-28 md:pt-[100px] lg:pt-[120px] pb-12 sm:pb-16 md:pb-20 bg-[#F8FAFC] relative overflow-hidden"
    >
      {/* Gradiente decorativo sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#2563EB] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute top-60 -left-40 w-96 h-96 bg-[#0EA5A4] opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Columna izquierda - Contenido */}
          <div className="space-y-5 sm:space-y-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F172A] leading-tight font-inter">
              Gestione sus turnos médicos de forma inteligente
            </h1>

            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-xl">
              Optimice la gestión de turnos, historias clínicas y recordatorios
              en una sola plataforma moderna y segura.
            </p>

            {/* Botones CTA */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-medium shadow-sm hover:shadow-md transition-all duration-200 ease-out hover:scale-[1.02]"
                >
                  Solicitar turno
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link href="#como-funciona" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] rounded-xl px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-medium transition-all duration-200 ease-out hover:scale-[1.02]"
                >
                  <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Ver cómo funciona
                </Button>
              </Link>
            </div>
          </div>

          {/* Columna derecha - Ilustración */}
          <div className="relative lg:block hidden">
            <div className="relative">
              {/* Placeholder para ilustración - puedes reemplazar con una imagen real */}
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/10 to-[#0EA5A4]/10 rounded-3xl backdrop-blur-sm"></div>
                <div className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out">
                  {/* Dashboard médico simulado */}
                  <div className="space-y-4">
                    <div className="h-4 bg-[#2563EB]/20 rounded w-3/4"></div>
                    <div className="h-4 bg-[#0EA5A4]/20 rounded w-1/2"></div>
                    <div className="grid grid-cols-3 gap-3 mt-6">
                      <div className="h-20 bg-gradient-to-br from-[#2563EB] to-[#1E40AF] rounded-xl"></div>
                      <div className="h-20 bg-gradient-to-br from-[#0EA5A4] to-[#0D9488] rounded-xl"></div>
                      <div className="h-20 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-xl"></div>
                    </div>
                    <div className="h-32 bg-[#F8FAFC] rounded-xl mt-4 border border-[#E2E8F0]"></div>
                  </div>
                </div>
              </div>
              {/* Animación floating suave */}
              <div className="absolute inset-0 animate-pulse opacity-20">
                <div className="w-full h-full bg-[#2563EB] rounded-3xl blur-2xl"></div>
              </div>
            </div>
          </div>

          {/* Versión mobile de la ilustración */}
          <div className="lg:hidden relative mt-8">
            <div className="relative w-full aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/10 to-[#0EA5A4]/10 rounded-3xl"></div>
              <div className="relative bg-white rounded-2xl shadow-xl p-6">
                <div className="space-y-3">
                  <div className="h-3 bg-[#2563EB]/20 rounded w-3/4"></div>
                  <div className="h-3 bg-[#0EA5A4]/20 rounded w-1/2"></div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="h-16 bg-gradient-to-br from-[#2563EB] to-[#1E40AF] rounded-lg"></div>
                    <div className="h-16 bg-gradient-to-br from-[#0EA5A4] to-[#0D9488] rounded-lg"></div>
                    <div className="h-16 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
