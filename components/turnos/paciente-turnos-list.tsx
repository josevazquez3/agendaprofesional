"use client"

import { AppointmentTable } from "./appointment-table"

interface Turno {
  id: string
  fecha: Date
  hora: string
  estado: string
  motivoEliminacion?: string | null
  eliminadoAt?: Date | string | null
  eliminadoPor?: { nombre: string }
  paciente?: {
    nombre: string
    email?: string
  }
  profesional?: {
    user?: { nombre: string }
    especialidad?: string
  } | null
}

interface PacienteTurnosListProps {
  turnos: Turno[]
  basePath: string
}

export function PacienteTurnosList({ turnos, basePath }: PacienteTurnosListProps) {
  return (
    <AppointmentTable
      turnos={turnos}
      basePath={basePath}
      showQuickConsultation={false}
      showEliminar={false}
    />
  )
}
