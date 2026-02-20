"use client"

import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"

const productoLinks = [
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#planes", label: "Planes" },
]

const empresaLinks = [
  { href: "#inicio", label: "Inicio" },
  { href: "#contacto-demo", label: "Contacto" },
]

const legalLinks = [
  { href: "#", label: "Términos de uso" },
  { href: "#", label: "Privacidad" },
]

const contactInfo = [
  { icon: Mail, text: "contacto@agendaprofesional.com", href: "mailto:contacto@agendaprofesional.com" },
  { icon: Phone, text: "+54 11 1234-5678", href: "tel:+541112345678" },
  { icon: MapPin, text: "Av. Corrientes 1234, CABA", href: "#" },
]

/**
 * Footer — Dark #0F172A, 4 columns: Logo+tagline, Producto, Empresa, Legal
 */
export function PublicFooter() {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#") && href !== "#") {
      e.preventDefault()
      const element = document.querySelector(href)
      if (element) {
        const offset = 72
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - offset
        window.scrollTo({ top: offsetPosition, behavior: "smooth" })
      }
    }
  }

  return (
    <footer
      className="bg-[#0F172A] text-white"
      role="contentinfo"
      aria-label="Pie de página"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Logo + tagline */}
          <div className="lg:col-span-1">
            <h3 className="text-xl font-semibold mb-4 text-white">
              Agenda Profesional
            </h3>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#94A3B8" }}>
              La plataforma médica que su clínica necesita. Turnos, historia
              clínica y pacientes en un solo lugar.
            </p>
          </div>

          {/* Col 2: Producto */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Producto</h4>
            <ul className="space-y-3">
              {productoLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-sm hover:text-[#2563EB] transition-colors"
                    style={{ color: "#94A3B8" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Empresa */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Empresa</h4>
            <ul className="space-y-3">
              {empresaLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-sm hover:text-[#2563EB] transition-colors"
                    style={{ color: "#94A3B8" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Legal + Contacto */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-3 mb-6">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-[#2563EB] transition-colors"
                    style={{ color: "#94A3B8" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="font-semibold mb-4 text-white">Contacto</h4>
            <ul className="space-y-4">
              {contactInfo.map((contact, i) => {
                const Icon = contact.icon
                return (
                  <li key={i} className="flex items-start gap-3">
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#94A3B8" }} strokeWidth={1.5} />
                    {contact.href !== "#" ? (
                      <Link
                        href={contact.href}
                        className="text-sm hover:text-[#2563EB] transition-colors"
                        style={{ color: "#94A3B8" }}
                      >
                        {contact.text}
                      </Link>
                    ) : (
                      <span className="text-sm" style={{ color: "#94A3B8" }}>{contact.text}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[#1E293B]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm" style={{ color: "#94A3B8" }}>
            © {new Date().getFullYear()} Agenda Profesional. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
