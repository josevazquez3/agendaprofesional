"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface HourSelectorPopupProps {
  profesionalId: string
  fecha: string
  value: string
  onChange: (hour: string) => void
  className?: string
}

export function HourSelectorPopup({
  profesionalId,
  fecha,
  value,
  onChange,
  className,
}: HourSelectorPopupProps) {
  const { data: session } = useSession()
  const [showPopup, setShowPopup] = useState(false)
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showAllHours, setShowAllHours] = useState(false)
  const [infoHorarios, setInfoHorarios] = useState<{
    diaSemana?: string
    totalHorariosConfigurados?: number
    turnosOcupados?: number
    bloqueos?: number
  } | null>(null)

  // Cargar horarios automáticamente cuando cambia la fecha o profesional
  useEffect(() => {
    if (profesionalId && fecha) {
      fetchHorariosDisponibles()
    } else {
      setHorariosDisponibles([])
    }
  }, [profesionalId, fecha])

  // Establecer el primer horario disponible como valor por defecto cuando hay horarios y cambia la fecha
  useEffect(() => {
    if (horariosDisponibles.length > 0 && profesionalId && fecha) {
      // Si no hay valor seleccionado o el valor actual no está en los horarios disponibles, usar el primero
      if (!value || !horariosDisponibles.includes(value)) {
        onChange(horariosDisponibles[0])
      }
    } else if (!horariosDisponibles.length && profesionalId && fecha && value) {
      // Si no hay horarios disponibles y hay un valor, limpiar el campo
      onChange("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horariosDisponibles.length, fecha, profesionalId])

  const fetchHorariosDisponibles = async () => {
    if (!profesionalId || !fecha) {
      setHorariosDisponibles([])
      setInfoHorarios(null)
      return
    }

    setLoading(true)
    try {
      let fechaFormateada = fecha
      if (fecha.includes("/")) {
        const partes = fecha.split("/")
        if (partes.length === 3) {
          const [dia, mes, anio] = partes
          fechaFormateada = `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
        }
      } else if (fecha.includes("T")) {
        fechaFormateada = fecha.split("T")[0]
      }

      const url = `/api/horarios/disponibles?profesionalId=${profesionalId}&fecha=${fechaFormateada}`
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error horarios disponibles:", errorData?.error || response.status)
        setHorariosDisponibles([])
        setInfoHorarios(null)
        return
      }

      const data = await response.json()
      if (data.error) {
        setHorariosDisponibles([])
        setInfoHorarios(null)
        return
      }

      const horarios = data.horarios || []
      setHorariosDisponibles(horarios)
      setInfoHorarios({
        diaSemana: data.diaSemana,
        totalHorariosConfigurados: data.totalHorariosConfigurados,
        turnosOcupados: data.turnosOcupados,
        bloqueos: data.bloqueos,
      })
    } catch (error: any) {
      console.error("Error cargando horarios disponibles:", error?.message)
      setHorariosDisponibles([])
      setInfoHorarios(null)
    } finally {
      setLoading(false)
    }
  }

  const handleHourClick = (hour: string) => {
    onChange(hour)
    setShowPopup(false)
    setShowAllHours(false)
  }

  return (
    <div className={cn("relative", className)}>
      <Label htmlFor="hora">Hora *</Label>
      
      {/* Siempre mostrar select cuando hay profesional y fecha seleccionados */}
      {profesionalId && fecha ? (
        loading ? (
          <Input
            id="hora"
            type="text"
            value=""
            readOnly
            placeholder="Cargando horarios disponibles..."
            className="cursor-wait bg-gray-50"
          />
        ) : (
          <div className="space-y-2">
            <select
              id="hora"
              value={value || ""}
              onChange={(e) => {
                onChange(e.target.value)
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
              required
            >
              <option value="">
                {horariosDisponibles.length > 0
                  ? `Seleccione una hora (${horariosDisponibles.length} disponibles)`
                  : "No hay horarios disponibles"}
              </option>
              {horariosDisponibles.map((hora) => (
                <option key={hora} value={hora}>
                  {hora}
                </option>
              ))}
            </select>
            {horariosDisponibles.length > 0 && (
              <p className="text-xs text-gray-600">
                {horariosDisponibles.length} horario{horariosDisponibles.length !== 1 ? "s" : ""} disponible
                {horariosDisponibles.length !== 1 ? "s" : ""} para esta fecha
              </p>
            )}
            {!loading && horariosDisponibles.length === 0 && profesionalId && fecha && (
              <div className="mt-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                {infoHorarios?.totalHorariosConfigurados === 0 ? (
                  <>
                    <p className="font-medium">
                      Sin horarios para este día{infoHorarios?.diaSemana ? ` (${infoHorarios.diaSemana.toLowerCase()})` : ""}.
                    </p>
                    <p className="mt-1 text-xs">
                      Agregue días y horarios de atención en:{" "}
                      {session?.user?.role === "ADMIN" && profesionalId && (
                        <Link href={`/dashboard/admin/profesionales/${profesionalId}/editar`} className="underline font-medium">
                          Editar profesional → Horarios de atención
                        </Link>
                      )}
                      {session?.user?.role === "SECRETARIA" && (
                        <Link href="/dashboard/secretaria/horarios" className="underline font-medium">
                          Configuración → Horarios
                        </Link>
                      )}
                      {(session?.user?.role !== "ADMIN" || !profesionalId) && session?.user?.role !== "SECRETARIA" && "Editar profesional o Configuración → Horarios"}
                    </p>
                  </>
                ) : (
                  <p>
                    No hay franjas libres en esta fecha.
                    {infoHorarios && (infoHorarios.totalHorariosConfigurados ?? 0) > 0 && " Todos los horarios están ocupados o bloqueados."}
                  </p>
                )}
              </div>
            )}
          </div>
        )
      ) : (
        <Input
          id="hora"
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
          }}
          placeholder="Primero seleccione profesional y fecha"
          disabled={!profesionalId || !fecha}
        />
      )}
      
      {showPopup && profesionalId && fecha && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPopup(false)}
          />
          <div className="absolute z-50 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl min-w-[220px] max-w-[320px] max-h-[400px] overflow-y-auto">
            <div className="font-semibold mb-2 text-sm sticky top-0 bg-gray-900 pb-1">
              Horarios disponibles ({horariosDisponibles.length}):
            </div>
            
            {loading ? (
              <div className="py-4 text-center text-gray-400">
                Cargando horarios...
              </div>
            ) : horariosDisponibles.length === 0 ? (
              <div className="py-4 text-center text-gray-400 space-y-2">
                <div className="font-semibold">No hay horarios disponibles para esta fecha</div>
                {infoHorarios && (
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    {infoHorarios.totalHorariosConfigurados === 0 ? (
                      <div>El profesional no tiene horarios configurados para {infoHorarios.diaSemana}</div>
                    ) : (
                      <>
                        {infoHorarios.turnosOcupados && infoHorarios.turnosOcupados > 0 && (
                          <div>Turnos ocupados: {infoHorarios.turnosOcupados}</div>
                        )}
                        {infoHorarios.bloqueos && infoHorarios.bloqueos > 0 && (
                          <div>Bloqueos: {infoHorarios.bloqueos}</div>
                        )}
                        <div className="mt-2 text-gray-400">
                          Todos los horarios están ocupados o bloqueados
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {(showAllHours ? horariosDisponibles : horariosDisponibles.slice(0, 12)).map((hora, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleHourClick(hora)}
                      className={cn(
                        "px-2.5 py-1.5 rounded font-medium transition-all cursor-pointer active:scale-95 shadow-sm",
                        value === hora
                          ? "bg-blue-800 text-white"
                          : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
                      )}
                    >
                      {hora}
                    </button>
                  ))}
                </div>
                
                {horariosDisponibles.length > 12 && (
                  <div className="w-full mt-2 pt-2 border-t border-gray-700">
                    {!showAllHours ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowAllHours(true)
                        }}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                      >
                        Ver todos los {horariosDisponibles.length} horarios ↓
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowAllHours(false)
                        }}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                      >
                        Ver menos ↑
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
