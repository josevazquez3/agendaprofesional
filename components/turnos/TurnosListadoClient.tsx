"use client"

import { useRouter } from "next/navigation"
import { ListadoTurnosConSeleccion } from "./ListadoTurnosConSeleccion"

interface Turno {
  id: string
  fecha: Date
  hora: string
  estado: string
  motivoEliminacion?: string | null
  paciente: {
    nombre: string
  }
  profesional: {
    user: {
      nombre: string
    }
    especialidad: string
  }
  consultorioProfesional?: {
    consultorio: {
      direccion: string
    }
  } | null
  obraSocial?: string | null
}

interface TurnosListadoClientProps {
  turnos: Turno[]
  basePath: string
}

export function TurnosListadoClient({
  turnos,
  basePath,
}: TurnosListadoClientProps) {
  const router = useRouter()

  const handleEliminar = async (turnoIds: string[], causa: string) => {
    try {
      const response = await fetch("/api/turnos/eliminar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnoIds, causa }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar turnos")
      }

      // Recargar la página para mostrar los cambios
      router.refresh()
    } catch (error: any) {
      alert(error.message || "Error al eliminar turnos")
      throw error
    }
  }

  return (
    <ListadoTurnosConSeleccion
      turnos={turnos}
      basePath={basePath}
      onEliminar={handleEliminar}
    />
  )
}
