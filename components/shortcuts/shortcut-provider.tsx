"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface ShortcutProviderProps {
  children: React.ReactNode
}

export function ShortcutProvider({ children }: ShortcutProviderProps) {
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si está escribiendo en un input/textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      // N → Nuevo turno
      if (e.key === "n" || e.key === "N") {
        e.preventDefault()
        const role = session?.user?.role
        if (role === "ADMIN") {
          router.push("/dashboard/admin/turnos/nuevo")
        } else if (role === "SECRETARIA") {
          router.push("/dashboard/secretaria/turnos/nuevo")
        }
      }

      // P → Nuevo paciente
      if (e.key === "p" || e.key === "P") {
        e.preventDefault()
        const role = session?.user?.role
        if (role === "ADMIN") {
          router.push("/dashboard/admin/usuarios/nuevo")
        } else if (role === "SECRETARIA") {
          router.push("/dashboard/secretaria/pacientes/nuevo")
        }
      }

      // E → Nueva evolución
      if (e.key === "e" || e.key === "E") {
        e.preventDefault()
        router.push("/dashboard/historia-clinica/nueva")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router, session])

  return <>{children}</>
}
