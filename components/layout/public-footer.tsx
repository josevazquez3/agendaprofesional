"use client"

import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"

const navigationLinks = [
  { href: "#inicio", label: "Inicio" },
  { href: "#especialidades", label: "Especialidades" },
  { href: "#profesionales", label: "Profesionales" },
  { href: "#contacto", label: "Contacto" },
]

const serviceLinks = [
  { href: "#turnos", label: "Turnos online" },
  { href: "#historia-clinica", label: "Historia clínica digital" },
  { href: "#recordatorios", label: "Recordatorios automáticos" },
  { href: "#gestion", label: "Gestión de pacientes" },
]

const contactInfo = [
  {
    icon: Mail,
    text: "contacto@agendaprofesional.com",
    href: "mailto:contacto@agendaprofesional.com",
  },
  {
    icon: Phone,
    text: "+54 11 1234-5678",
    href: "tel:+541112345678",
  },
  {
    icon: MapPin,
    text: "Av. Corrientes 1234, CABA, Argentina",
    href: "#",
  },
]

export function PublicFooter() {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
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
    }
  }

  return (
    <footer className="bg-[#0F172A] text-white">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-16">
        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Columna 1 - Marca */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-semibold mb-4 font-inter text-white">
              Agenda Profesional
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed max-w-xs">
              Plataforma moderna de gestión médica diseñada para optimizar turnos,
              profesionales y pacientes.
            </p>
          </div>

          {/* Columna 2 - Navegación */}
          <div>
            <h4 className="font-semibold mb-4 font-inter text-white">
              Navegación
            </h4>
            <ul className="space-y-3">
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-sm text-[#94A3B8] hover:text-[#2563EB] transition-all duration-200 ease-out font-medium inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3 - Servicios */}
          <div>
            <h4 className="font-semibold mb-4 font-inter text-white">
              Servicios
            </h4>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-sm text-[#94A3B8] hover:text-[#2563EB] transition-all duration-200 ease-out font-medium inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4 - Contacto */}
          <div>
            <h4 className="font-semibold mb-4 font-inter text-white">
              Contacto
            </h4>
            <ul className="space-y-4">
              {contactInfo.map((contact, index) => {
                const Icon = contact.icon
                return (
                  <li key={index} className="flex items-start space-x-3">
                    <Icon
                      className="h-4 w-4 text-[#94A3B8] mt-0.5 flex-shrink-0"
                      strokeWidth={1.5}
                    />
                    {contact.href !== "#" ? (
                      <Link
                        href={contact.href}
                        className="text-sm text-[#94A3B8] hover:text-[#2563EB] transition-all duration-200 ease-out font-medium"
                      >
                        {contact.text}
                      </Link>
                    ) : (
                      <span className="text-sm text-[#94A3B8] font-medium">
                        {contact.text}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-[#1E293B]">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-[#94A3B8]">
            © 2026 Agenda Profesional. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
