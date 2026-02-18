"use client"

import { Button } from "@/components/ui/button"
import { FileDown, FileText } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Turno {
  id: string
  /** ISO string desde Server Component para evitar error de serialización */
  fecha: Date | string
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
  obraSocial?: string | null
  consultorioProfesional?: {
    consultorio: {
      direccion: string
    }
  } | null
}

interface ExportarTurnosButtonsProps {
  turnos: Turno[]
}

export function ExportarTurnosButtons({ turnos }: ExportarTurnosButtonsProps) {
  const prepararDatosTurnos = () => {
    return turnos.map((turno) => ({
      fecha: formatDate(turno.fecha),
      hora: turno.hora,
      pacienteNombre: turno.paciente.nombre,
      profesionalNombre: turno.profesional.user.nombre,
      estado: turno.estado,
      especialidad: turno.profesional.especialidad,
      obraSocial: turno.obraSocial || "",
      direccion: turno.consultorioProfesional?.consultorio.direccion || "",
      motivoEliminacion: turno.motivoEliminacion || "",
    }))
  }

  const exportarExcel = async () => {
    if (turnos.length === 0) {
      alert("No hay turnos para exportar")
      return
    }

    try {
      const turnosFormateados = prepararDatosTurnos()

      const response = await fetch("/api/turnos/exportar/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnos: turnosFormateados }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al exportar a Excel")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `turnos_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error.message || "Error al exportar a Excel")
    }
  }

  const exportarPDF = async () => {
    if (turnos.length === 0) {
      alert("No hay turnos para exportar")
      return
    }

    try {
      const turnosFormateados = prepararDatosTurnos()

      const response = await fetch("/api/turnos/exportar/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnos: turnosFormateados }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al exportar a PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `turnos_${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error.message || "Error al exportar a PDF")
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={exportarExcel} variant="outline" size="sm">
        <FileDown className="h-4 w-4 mr-2" />
        Exportar Excel
      </Button>
      <Button onClick={exportarPDF} variant="outline" size="sm">
        <FileText className="h-4 w-4 mr-2" />
        Exportar PDF
      </Button>
    </div>
  )
}
