"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { format } from "date-fns"
import { AppointmentStatusBadge } from "./appointment-status-badge"
import { Button } from "@/components/ui/button"
import { Edit, Calendar, X, Stethoscope, AlertTriangle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { staggerContainer, staggerItem } from "@/lib/animations"
import { EliminarTurnosModal } from "./EliminarTurnosModal"

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
    user?: {
      nombre: string
    }
    especialidad?: string
  } | null
}

interface AppointmentTableProps {
  turnos: Turno[]
  basePath: string
  showQuickConsultation?: boolean
  onQuickConsultation?: (turnoId: string, pacienteNombre: string) => void
  /** Mostrar botón Eliminar (lógico) con causa; para admin/secretaria */
  showEliminar?: boolean
}

export function AppointmentTable({
  turnos,
  basePath,
  showQuickConsultation = false,
  onQuickConsultation,
  showEliminar = false,
}: AppointmentTableProps) {
  const router = useRouter()
  const [eliminarModal, setEliminarModal] = useState<{ turnoId: string } | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const handleEliminarConfirm = async (causa: string) => {
    if (!eliminarModal) return
    setEliminando(true)
    try {
      const res = await fetch("/api/turnos/eliminar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnoIds: [eliminarModal.turnoId], causa }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al eliminar")
      setEliminarModal(null)
      router.refresh()
    } catch (e: any) {
      alert(e.message || "Error al eliminar turno")
    } finally {
      setEliminando(false)
    }
  }

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
      className="overflow-x-auto -mx-1"
    >
      <table className="w-full min-w-[920px]">
        <thead>
          <tr className="border-b border-[#E2E8F0]">
            <th className="text-left py-4 px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wide min-w-[120px]">
              Fecha / Hora
            </th>
            <th className="text-left py-4 px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wide min-w-[140px]">
              Paciente
            </th>
            <th className="text-left py-4 px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wide min-w-[120px]">
              Profesional
            </th>
            <th className="text-left py-4 px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wide min-w-[100px]">
              Especialidad
            </th>
            <th className="text-left py-4 px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wide min-w-[100px]">
              Estado
            </th>
            <th className="text-right py-4 px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wide min-w-[120px]">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]">
          {turnos.map((turno) => (
            <React.Fragment key={turno.id}>
            <motion.tr
              variants={staggerItem}
              className="hover:bg-slate-50 transition-colors duration-150 ease-out"
            >
              <td className="py-4 px-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#0F172A]">
                    {format(new Date(turno.fecha), "dd/MM/yyyy")}
                  </span>
                  <span className="text-xs text-[#64748B] mt-0.5">{turno.hora}</span>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#0F172A]">
                    {turno.paciente?.nombre ?? "—"}
                  </span>
                  {turno.paciente?.email && (
                    <span className="text-xs text-[#64748B] mt-0.5">
                      {turno.paciente?.email}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-[#0F172A]">
                  {turno.profesional?.user?.nombre || "Sin asignar"}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-[#64748B]">
                  {turno.profesional?.especialidad || "-"}
                </span>
              </td>
              <td className="py-4 px-4">
                <AppointmentStatusBadge status={turno.estado} />
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center justify-end gap-2">
                  {showQuickConsultation &&
                    onQuickConsultation &&
                    (turno.estado === "CONFIRMADO" ||
                      turno.estado === "PENDIENTE") && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() =>
                          onQuickConsultation(turno.id, turno.paciente?.nombre ?? "")
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
                  <Link
                    href={`${basePath}/${turno.id}/editar`}
                    title="Reprogramar (cambiar fecha/hora)"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-all duration-200 ease-out"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </Link>
                  {showEliminar &&
                    turno.estado !== "CANCELADO" &&
                    turno.estado !== "ELIMINADO" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-[#FEE2E2] hover:text-[#991B1B] transition-all duration-200 ease-out"
                        onClick={() => setEliminarModal({ turnoId: turno.id })}
                        title="Eliminar turno (lógico)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                </div>
              </td>
            </motion.tr>
            {turno.estado === "ELIMINADO" && (
              <motion.tr key={`${turno.id}-eliminado`} variants={staggerItem} className="bg-red-50/50">
                <td colSpan={6} className="py-2 px-4">
                  <div className="p-3 rounded-md border border-red-200 bg-red-50 text-red-800 text-sm">
                    <p className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Turno Eliminado
                    </p>
                    {turno.motivoEliminacion && (
                      <p className="mt-1"><strong>Causa de eliminación:</strong> {turno.motivoEliminacion}</p>
                    )}
                    {turno.eliminadoAt && (
                      <p className="mt-0.5"><strong>Fecha de eliminación:</strong> {format(new Date(turno.eliminadoAt), "dd/MM/yyyy HH:mm")}</p>
                    )}
                    {turno.eliminadoPor?.nombre && (
                      <p className="mt-0.5"><strong>Eliminado por:</strong> {turno.eliminadoPor.nombre}</p>
                    )}
                  </div>
                </td>
              </motion.tr>
            )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {showEliminar && (
        <EliminarTurnosModal
          open={eliminarModal !== null}
          onClose={() => setEliminarModal(null)}
          onConfirm={handleEliminarConfirm}
          cantidad={1}
        />
      )}
    </motion.div>
  )
}
