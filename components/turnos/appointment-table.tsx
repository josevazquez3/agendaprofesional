"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { format } from "date-fns"
import { AppointmentStatusBadge } from "./appointment-status-badge"
import { Button } from "@/components/ui/button"
import { Edit, Calendar, X, Stethoscope } from "lucide-react"
import { cn } from "@/lib/utils"
import { staggerContainer, staggerItem } from "@/lib/animations"

interface Turno {
  id: string
  fecha: Date
  hora: string
  estado: string
  paciente: {
    nombre: string
    email?: string
  }
  profesional?: {
    user: {
      nombre: string
    }
    especialidad: string
  } | null
}

interface AppointmentTableProps {
  turnos: Turno[]
  basePath: string
  showQuickConsultation?: boolean
  onQuickConsultation?: (turnoId: string, pacienteNombre: string) => void
}

export function AppointmentTable({
  turnos,
  basePath,
  showQuickConsultation = false,
  onQuickConsultation,
}: AppointmentTableProps) {
  if (turnos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[#64748B]">No hay turnos disponibles</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="overflow-x-auto"
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E2E8F0]">
            <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Hora
            </th>
            <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Paciente
            </th>
            <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Profesional
            </th>
            <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Especialidad
            </th>
            <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Estado
            </th>
            <th className="text-right py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]">
          {turnos.map((turno) => (
            <motion.tr
              key={turno.id}
              variants={staggerItem}
              className="hover:bg-slate-50 transition-colors duration-150 ease-out"
            >
              <td className="py-5 px-6">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#0F172A]">
                    {format(new Date(turno.fecha), "dd/MM/yyyy")}
                  </span>
                  <span className="text-xs text-[#64748B] mt-0.5">{turno.hora}</span>
                </div>
              </td>
              <td className="py-5 px-6">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#0F172A]">
                    {turno.paciente.nombre}
                  </span>
                  {turno.paciente.email && (
                    <span className="text-xs text-[#64748B] mt-0.5">
                      {turno.paciente.email}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-5 px-6">
                <span className="text-sm text-[#0F172A]">
                  {turno.profesional?.user.nombre || "Sin asignar"}
                </span>
              </td>
              <td className="py-5 px-6">
                <span className="text-sm text-[#64748B]">
                  {turno.profesional?.especialidad || "-"}
                </span>
              </td>
              <td className="py-5 px-6">
                <AppointmentStatusBadge status={turno.estado} />
              </td>
              <td className="py-5 px-6">
                <div className="flex items-center justify-end gap-2">
                  {showQuickConsultation &&
                    onQuickConsultation &&
                    (turno.estado === "CONFIRMADO" ||
                      turno.estado === "PENDIENTE") && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() =>
                          onQuickConsultation(turno.id, turno.paciente.nombre)
                        }
                        className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-medium transition-all duration-200 ease-out"
                      >
                        <Stethoscope className="h-4 w-4 mr-1.5" />
                        Iniciar consulta
                      </Button>
                    )}
                  <Link href={`${basePath}/${turno.id}/editar`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-all duration-200 ease-out"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`${basePath}/${turno.id}/reprogramar`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-all duration-200 ease-out"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </Link>
                  {turno.estado !== "CANCELADO" &&
                    turno.estado !== "ELIMINADO" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-[#FEE2E2] hover:text-[#991B1B] transition-all duration-200 ease-out"
                        onClick={async () => {
                          if (
                            confirm(
                              "¿Está seguro de cancelar este turno?"
                            )
                          ) {
                            // Implementar cancelación
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  )
}
