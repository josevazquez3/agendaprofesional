"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

/**
 * Hero Section — Full-width dark navy, gradient headline,
 * dashboard mockup (CSS/SVG), animated gradient orbs
 */
export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative min-h-[90vh] flex items-center pt-24 sm:pt-28 md:pt-32 pb-20 overflow-hidden"
      style={{ backgroundColor: "#0F172A" }}
      aria-label="Sección principal"
    >
      {/* Animated gradient orbs — CSS only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] animate-float"
          style={{
            background: "linear-gradient(135deg, #2563EB 0%, #10B981 100%)",
            top: "10%",
            right: "10%",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[80px] animate-float"
          style={{
            background: "linear-gradient(225deg, #10B981 0%, #2563EB 100%)",
            bottom: "20%",
            left: "5%",
            animationDelay: "-2s",
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-10 blur-[60px] animate-pulse-soft"
          style={{
            background: "#2563EB",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy + CTAs */}
          <div className="space-y-8 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              <span
                className="bg-clip-text text-transparent bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#10B981]"
                style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
              >
                Plataforma gestión de turnos
              </span>
            </h1>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/auth/register">
                <Button
                  className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium transition-all duration-200 px-8 py-4 text-base"
                >
                  Turnos
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] bg-transparent rounded-xl font-medium transition-all duration-200 px-8 py-4 text-base"
                >
                  Ingresar
                </Button>
              </Link>
            </div>

          </div>

          {/* Right: Dashboard mockup — CSS/SVG only */}
          <div className="relative hidden lg:block">
            <div
              className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
              style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
            >
              {/* Mini dashboard UI */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-3/4 rounded bg-white/20" />
                  <div className="h-3 w-1/2 rounded bg-white/10" />
                </div>
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className="h-16 rounded-xl bg-gradient-to-br from-[#2563EB]/40 to-[#1E40AF]/40 border border-white/5" />
                  <div className="h-16 rounded-xl bg-gradient-to-br from-[#10B981]/40 to-[#059669]/40 border border-white/5" />
                  <div className="h-16 rounded-xl bg-gradient-to-br from-[#7C3AED]/40 to-[#6D28D9]/40 border border-white/5" />
                </div>
                {/* Mini calendar mockup */}
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
                      <span key={i} className="text-xs text-white/40 font-medium">
                        {d}
                      </span>
                    ))}
                    {Array.from({ length: 35 }).map((_, i) => {
                      const day = i + 1
                      const isSelected = day === 12 || day === 15
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded flex items-center justify-center text-xs ${
                            isSelected ? "bg-[#2563EB]/60 text-white" : "text-white/60"
                          }`}
                        >
                          {day <= 31 ? day : ""}
                        </div>
                      )
                    })}
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
