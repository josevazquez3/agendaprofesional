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
      const offset = 72 // Altura del navbar
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-[#E2E8F0] h-[72px]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo izquierda */}
          <Link href="/" className="flex-shrink-0 mr-8 lg:mr-12">
            <span className="text-xl font-semibold text-[#0F172A] font-inter">
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

          {/* Botones - Desktop (separados del enlace Contacto) */}
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

          {/* Menú hamburguesa - Mobile */}
          <div className="md:hidden flex items-center space-x-4">
            <Link href="/auth/register">
              <Button className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out hover:scale-[1.02]">
                Solicitar turno
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#0F172A]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Menú móvil desplegable */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-[72px] left-0 right-0 bg-white border-b border-[#E2E8F0] shadow-lg">
            <div className="px-6 py-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    handleNavClick(e, link.href)
                    setMobileMenuOpen(false)
                  }}
                  className="block text-[#64748B] hover:text-[#2563EB] transition-colors duration-200 py-2"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block"
              >
                <Button
                  variant="outline"
                  className="w-full border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] rounded-xl font-medium mt-2 transition-all duration-200 ease-out hover:scale-[1.02]"
                >
                  Ingresar
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
