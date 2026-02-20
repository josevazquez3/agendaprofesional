"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: "#inicio", label: "Inicio" },
    { href: "#especialidades", label: "Especialidades" },
    { href: "#profesionales", label: "Profesionales" },
    { href: "#contacto", label: "Contacto" },
  ]

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const element = document.querySelector(href)
    if (element) {
      const offset = 56 // Altura del navbar (móvil); desktop es 72px pero 56 evita solapamiento
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
    setMobileMenuOpen(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-[#E2E8F0] min-h-[56px] md:h-[72px]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-full min-h-[56px] md:min-h-[72px]">
        <div className="flex items-center justify-between h-full gap-2">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 min-w-0">
            <span className="text-base sm:text-lg md:text-xl font-semibold text-[#0F172A] font-inter truncate block">
              Agenda Profesional
            </span>
          </Link>

          {/* Links navegación - Desktop */}
          <div className="hidden md:flex items-center space-x-8 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-[#64748B] hover:text-[#2563EB] transition-colors duration-200 text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Botones - Desktop */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0 ml-8 lg:ml-12 pl-8 lg:pl-10 border-l border-[#E2E8F0]">
            <Link href="/auth/login">
              <Button
                variant="outline"
                className="border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] rounded-xl font-medium transition-all duration-200 ease-out hover:scale-[1.02]"
              >
                Ingresar
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl px-6 py-2 font-medium transition-all duration-200 ease-out hover:scale-[1.02]">
                Solicitar turno
              </Button>
            </Link>
          </div>

          {/* Solo hamburguesa en móvil (login y registro van dentro del menú) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex-shrink-0 p-2 -mr-2 text-[#0F172A] rounded-lg hover:bg-[#F1F5F9]"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Menú móvil desplegable: enlaces + Ingresar + Solicitar turno */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-[#E2E8F0] shadow-lg">
            <div className="px-4 py-4 space-y-1 max-h-[calc(100vh-56px)] overflow-y-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    handleNavClick(e, link.href)
                    setMobileMenuOpen(false)
                  }}
                  className="block text-[#64748B] hover:text-[#2563EB] transition-colors py-3 px-2 text-base font-medium"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-[#E2E8F0] pt-4 mt-4 space-y-3">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button
                    variant="outline"
                    className="w-full border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] rounded-xl font-medium py-3 text-base"
                  >
                    Ingresar
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button className="w-full bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium py-3 text-base">
                    Solicitar turno
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
