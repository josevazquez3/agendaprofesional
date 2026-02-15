"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDateTime } from "@/lib/utils"
import { format } from "date-fns"
import { Trash2, AlertTriangle } from "lucide-react"
import { EliminarTurnosModal } from "./EliminarTurnosModal"

interface Turno {
  id: string
  fecha: Date
  hora: string
  estado: string
  motivoEliminacion?: string | null
  eliminadoAt?: Date | string | null
  eliminadoPor?: { nombre: string }
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

interface ListadoTurnosConSeleccionProps {
  turnos: Turno[]
  basePath: string
  onEliminar: (turnoIds: string[], causa: string) => Promise<void>
}

export function ListadoTurnosConSeleccion({
  turnos,
  basePath,
  onEliminar,
}: ListadoTurnosConSeleccionProps) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [mostrarModal, setMostrarModal] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const toggleSeleccion = (turnoId: string) => {
    const nuevos = new Set(seleccionados)
    if (nuevos.has(turnoId)) {
      nuevos.delete(turnoId)
    } else {
      nuevos.add(turnoId)
    }
    setSeleccionados(nuevos)
  }

  const toggleTodos = () => {
    // Solo seleccionar turnos que no estén eliminados
    const turnosNoEliminados = turnos.filter((t) => t.estado !== "ELIMINADO")
    const idsNoEliminados = new Set(turnosNoEliminados.map((t) => t.id))
    
    if (seleccionados.size === idsNoEliminados.size && turnosNoEliminados.length > 0) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(idsNoEliminados)
    }
  }

  const handleEliminar = async (causa: string) => {
    if (seleccionados.size === 0) return

    setEliminando(true)
    try {
      await onEliminar(Array.from(seleccionados), causa)
      setSeleccionados(new Set())
      setMostrarModal(false)
    } catch (error) {
      console.error("Error eliminando turnos:", error)
    } finally {
      setEliminando(false)
    }
  }

  if (turnos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay turnos registrados
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={
              turnos.filter((t) => t.estado !== "ELIMINADO").length > 0 &&
              seleccionados.size === turnos.filter((t) => t.estado !== "ELIMINADO").length
            }
            onChange={toggleTodos}
            className="h-4 w-4 rounded border-gray-300"
            disabled={turnos.filter((t) => t.estado !== "ELIMINADO").length === 0}
          />
          <span className="text-sm text-gray-600">
            Seleccionar todos ({seleccionados.size} seleccionado{seleccionados.size !== 1 ? "s" : ""})
          </span>
        </div>
        {seleccionados.size > 0 && (
          <Button
            onClick={() => setMostrarModal(true)}
            className="bg-red-600 hover:bg-red-700"
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar ({seleccionados.size})
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {turnos.map((turno) => (
          <div
            key={turno.id}
            className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={seleccionados.has(turno.id)}
              onChange={() => toggleSeleccion(turno.id)}
              disabled={turno.estado === "ELIMINADO"}
              className="mt-1 h-4 w-4 rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h3 className="font-semibold text-lg">
                  {turno.paciente.nombre}
                </h3>
                <span className="text-sm text-gray-600">
                  con {turno.profesional.user.nombre}
                </span>
                <span className="text-sm text-gray-600">
                  - {turno.profesional.especialidad}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    turno.estado === "CONFIRMADO"
                      ? "bg-green-100 text-green-800"
                      : turno.estado === "CANCELADO"
                      ? "bg-red-100 text-red-800"
                      : turno.estado === "COMPLETADO"
                      ? "bg-blue-100 text-blue-800"
                      : turno.estado === "ELIMINADO"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {turno.estado}
                </span>
              </div>
              <p className="text-gray-600 mb-1">
                {formatDateTime(turno.fecha, turno.hora)}
              </p>
              {turno.consultorioProfesional && (
                <p className="text-sm text-gray-500">
                  📍 {turno.consultorioProfesional.consultorio.direccion}
                </p>
              )}
              {turno.obraSocial && (
                <p className="text-sm text-gray-500">
                  Obra Social: {turno.obraSocial}
                </p>
              )}
              {turno.estado === "ELIMINADO" && (
                <div className="mt-3 p-3 rounded-md border border-red-200 bg-red-50 text-red-800">
                  <p className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Turno Eliminado
                  </p>
                  {turno.motivoEliminacion && (
                    <p className="text-sm mt-1">
                      <strong>Causa de eliminación:</strong> {turno.motivoEliminacion}
                    </p>
                  )}
                  {turno.eliminadoAt && (
                    <p className="text-sm mt-0.5">
                      <strong>Fecha de eliminación:</strong>{" "}
                      {format(new Date(turno.eliminadoAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  )}
                  {turno.eliminadoPor?.nombre && (
                    <p className="text-sm mt-0.5">
                      <strong>Eliminado por:</strong> {turno.eliminadoPor.nombre}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {turno.estado !== "COMPLETADO" && turno.estado !== "ELIMINADO" && (
                <Link href={`${basePath}/${turno.id}/aceptar`}>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Aceptar
                  </Button>
                </Link>
              )}
              <Link href={`${basePath}/${turno.id}/editar`}>
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <EliminarTurnosModal
        open={mostrarModal}
        onClose={() => setMostrarModal(false)}
        onConfirm={handleEliminar}
        cantidad={seleccionados.size}
      />
    </>
  )
}
