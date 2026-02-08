"use client"

import { useEffect } from "react"

interface ClinicBrandingProps {
  colorPrimary?: string | null
  logo?: string | null
  nombre?: string
}

/**
 * Componente para aplicar branding dinámico de la clínica
 */
export function ClinicBranding({
  colorPrimary = "#2563EB",
  logo,
  nombre,
}: ClinicBrandingProps) {
  useEffect(() => {
    // Aplicar CSS variables dinámicas
    const root = document.documentElement
    root.style.setProperty("--brand-primary", colorPrimary || "#2563EB")
    
    // Calcular hover color (oscurecer 10%)
    const hoverColor = adjustBrightness(colorPrimary || "#2563EB", -10)
    root.style.setProperty("--brand-primary-hover", hoverColor)
  }, [colorPrimary])

  return null
}

/**
 * Ajustar brillo de un color hexadecimal
 */
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = ((num >> 8) & 0x00ff) + amt
  const B = (num & 0x0000ff) + amt
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  )
}
