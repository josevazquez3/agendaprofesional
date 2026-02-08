"use client"

import { useState, useEffect } from "react"
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

  useEffect(() => {
    if (profesionalId && fecha && showPopup) {
      fetchHorariosDisponibles()
    }
  }, [profesionalId, fecha, showPopup])

  const fetchHorariosDisponibles = async () => {
    if (!profesionalId || !fecha) {
      setHorariosDisponibles([])
      return
    }

    setLoading(true)
    try {
      // Asegurar que la fecha esté en formato YYYY-MM-DD
      const fechaFormateada = fecha.includes('T') ? fecha.split('T')[0] : fecha
      
      const response = await fetch(
        `/api/horarios/disponibles?profesionalId=${profesionalId}&fecha=${fechaFormateada}`
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error en la respuesta:", errorData)
        setHorariosDisponibles([])
        return
      }
      
      const data = await response.json()
      setHorariosDisponibles(data.horarios || [])
      setInfoHorarios({
        diaSemana: data.diaSemana,
        totalHorariosConfigurados: data.totalHorariosConfigurados,
        turnosOcupados: data.turnosOcupados,
        bloqueos: data.bloqueos,
      })
    } catch (error) {
      console.error("Error cargando horarios disponibles:", error)
      setHorariosDisponibles([])
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
      <Input
        id="hora"
        type="text"
        value={value}
        onClick={() => {
          if (profesionalId && fecha) {
            setShowPopup(true)
          }
        }}
        onChange={(e) => {
          // Permitir edición manual si no hay profesional/fecha seleccionados
          if (!profesionalId || !fecha) {
            onChange(e.target.value)
          }
        }}
        placeholder={profesionalId && fecha ? "Haga clic para ver horarios disponibles" : "Ingrese la hora"}
        className={profesionalId && fecha ? "cursor-pointer" : ""}
        readOnly={!!profesionalId && !!fecha}
      />
      
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
