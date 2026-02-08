"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"

/**
 * Prefetch Provider
 * Prefetch automático de páginas más usadas para mejorar performance perceptual
 */
export function PrefetchProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Prefetch de páginas más usadas cuando el usuario está en el dashboard
    if (pathname?.startsWith("/dashboard")) {
      // Prefetch de páginas comunes
      const commonPages = [
        "/dashboard/admin/turnos",
        "/dashboard/admin/pacientes",
        "/dashboard/secretaria/turnos",
        "/dashboard/secretaria/pacientes",
        "/dashboard/profesional/turnos",
      ]

      // Prefetch después de un pequeño delay para no bloquear carga inicial
      const prefetchTimer = setTimeout(() => {
        commonPages.forEach((page) => {
          router.prefetch(page)
        })
      }, 2000)

      return () => clearTimeout(prefetchTimer)
    }
  }, [pathname, router])

  return <>{children}</>
}
