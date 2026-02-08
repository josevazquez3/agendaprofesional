"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface CalendarWithAvailabilityProps {
  profesionalId: string
  value: string
  onChange: (date: string) => void
  onHourSelect?: (hour: string) => void
  minDate?: string
  className?: string
}

export function CalendarWithAvailability({
  profesionalId,
  value,
  onChange,
  onHourSelect,
  minDate,
  className,
}: CalendarWithAvailabilityProps) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [diasDisponibles, setDiasDisponibles] = useState<Record<string, string[]>>({})
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAllHours, setShowAllHours] = useState<string | null>(null)

  useEffect(() => {
    if (profesionalId && showCalendar) {
      fetchDiasDisponibles()
    }
  }, [profesionalId, currentMonth, showCalendar])

  const fetchDiasDisponibles = async () => {
    if (!profesionalId) return
    
    setLoading(true)
    try {
      // Cargar el mes actual y el siguiente
      const mesActual = currentMonth.getMonth() + 1
      const anioActual = currentMonth.getFullYear()
      const mesSiguiente = currentMonth.getMonth() + 2
      const anioSiguiente = mesSiguiente > 12 ? anioActual + 1 : anioActual
      const mesSiguienteAjustado = mesSiguiente > 12 ? 1 : mesSiguiente

      const [resActual, resSiguiente] = await Promise.all([
        fetch(
          `/api/horarios/dias-disponibles?profesionalId=${profesionalId}&mes=${mesActual}&anio=${anioActual}`
        ),
        fetch(
          `/api/horarios/dias-disponibles?profesionalId=${profesionalId}&mes=${mesSiguienteAjustado}&anio=${anioSiguiente}`
        ),
      ])

      const dataActual = await resActual.json()
      const dataSiguiente = await resSiguiente.json()

      // Combinar los días disponibles de ambos meses
      setDiasDisponibles({
        ...(dataActual.diasDisponibles || {}),
        ...(dataSiguiente.diasDisponibles || {}),
      })
    } catch (error) {
      console.error("Error cargando días disponibles:", error)
    } finally {
      setLoading(false)
    }
  }

  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: Array<{ date: Date; isCurrentMonth: boolean; isAvailable: boolean; horarios: string[] }> = []

    // Días del mes anterior
    const prevMonth = new Date(year, month - 1, 0)
    const daysInPrevMonth = prevMonth.getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i)
      days.push({
        date,
        isCurrentMonth: false,
        isAvailable: false,
        horarios: [],
      })
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      // Formatear como YYYY-MM-DD sin usar toISOString para evitar problemas de zona horaria
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const horarios = diasDisponibles[dateKey] || []
      const isAvailable = horarios.length > 0
      
      days.push({
        date,
        isCurrentMonth: true,
        isAvailable,
        horarios,
      })
    }

    // Días del mes siguiente para completar la cuadrícula
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        isAvailable: false,
        horarios: [],
      })
    }

    return days
  }

  const handleDateClick = (date: Date, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    
    // Crear la fecha sin problemas de zona horaria usando año, mes y día directamente
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    
    // Formatear como YYYY-MM-DD sin usar toISOString que puede cambiar el día por zona horaria
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const horarios = diasDisponibles[dateKey] || []
    
    // Siempre permitir seleccionar el día si es válido (no pasado)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const clickedDate = new Date(year, month, day)
    
    if (clickedDate >= today) {
      onChange(dateKey)
      // Cerrar el calendario después de seleccionar el día
      setShowCalendar(false)
      setHoveredDate(null)
      setShowAllHours(null)
    }
  }

  const handleHourClick = (hour: string, dateKey: string) => {
    if (onHourSelect) {
      onHourSelect(hour)
    }
    onChange(dateKey)
    setShowCalendar(false)
    setHoveredDate(null)
    setShowAllHours(null)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (date: Date) => {
    if (!value) return false
    try {
      // value viene en formato YYYY-MM-DD
      const [year, month, day] = value.split('-').map(Number)
      const selectedDate = new Date(year, month - 1, day)
      const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      return (
        currentDate.getDate() === selectedDate.getDate() &&
        currentDate.getMonth() === selectedDate.getMonth() &&
        currentDate.getFullYear() === selectedDate.getFullYear()
      )
    } catch {
      return false
    }
  }

  const isPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const days = getDaysInMonth(currentMonth)
  
  // Formatear la fecha seleccionada para mostrar en el input
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return ''
    try {
      // La fecha viene en formato YYYY-MM-DD
      const [year, month, day] = dateStr.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return date.toLocaleDateString('es-AR')
    } catch {
      return dateStr
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Label htmlFor="fecha">Fecha *</Label>
      <Input
        id="fecha"
        type="text"
        value={value ? formatDateForDisplay(value) : ''}
        onClick={() => setShowCalendar(!showCalendar)}
        readOnly
        placeholder="Seleccione una fecha"
        className="cursor-pointer"
      />
      
      {showCalendar && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowCalendar(false)}
          />
          <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-[350px]">
            {/* Header del calendario */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="font-semibold">
                {meses[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </div>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {diasSemana.map((dia) => (
                <div key={dia} className="text-center text-xs font-medium text-gray-500 py-1">
                  {dia}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                // Formatear como YYYY-MM-DD sin usar toISOString para evitar problemas de zona horaria
                const year = day.date.getFullYear()
                const month = day.date.getMonth()
                const dayNum = day.date.getDate()
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                
                const isPastDate = isPast(day.date)
                const isTodayDate = isToday(day.date)
                const isSelectedDate = isSelected(day.date)
                // Permitir seleccionar cualquier día válido (no pasado, del mes actual)
                const canSelect = !isPastDate && day.isCurrentMonth
                // Solo mostrar tooltip si hay horarios disponibles
                const canShowTooltip = day.isAvailable && canSelect

                return (
                  <div
                    key={index}
                    className={cn(
                      "relative aspect-square flex items-center justify-center text-sm rounded transition-colors",
                      !day.isCurrentMonth && "text-gray-300 cursor-default",
                      day.isCurrentMonth && isPastDate && "text-gray-400 cursor-not-allowed",
                      day.isCurrentMonth && !isPastDate && !day.isAvailable && !isSelectedDate && "text-gray-600 hover:bg-gray-100 cursor-pointer",
                      day.isCurrentMonth && !isPastDate && day.isAvailable && !isSelectedDate && "bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer",
                      isSelectedDate && "bg-blue-600 text-white font-semibold cursor-pointer",
                      isTodayDate && !isSelectedDate && day.isCurrentMonth && !isPastDate && "ring-2 ring-blue-400"
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (canSelect) {
                        handleDateClick(day.date, e)
                      }
                    }}
                    onMouseEnter={() => {
                      if (canShowTooltip) {
                        setHoveredDate(dateKey)
                      }
                    }}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    {day.date.getDate()}
                    
                    {/* Tooltip con horarios disponibles */}
                    {hoveredDate === dateKey && day.horarios.length > 0 && (
                      <div 
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 min-w-[220px] max-w-[320px] max-h-[400px] overflow-y-auto"
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                        }}
                      >
                        <div className="font-semibold mb-2 text-sm sticky top-0 bg-gray-900 pb-1">
                          Horarios disponibles ({day.horarios.length}):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(showAllHours === dateKey ? day.horarios : day.horarios.slice(0, 12)).map((hora, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleHourClick(hora, dateKey)}
                              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-2.5 py-1.5 rounded font-medium transition-all cursor-pointer active:scale-95 shadow-sm"
                            >
                              {hora}
                            </button>
                          ))}
                          {day.horarios.length > 12 && showAllHours !== dateKey && (
                            <div className="w-full mt-2 pt-2 border-t border-gray-700">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowAllHours(dateKey)
                                }}
                                className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                              >
                                Ver todos los {day.horarios.length} horarios ↓
                              </button>
                            </div>
                          )}
                          {showAllHours === dateKey && day.horarios.length > 12 && (
                            <div className="w-full mt-2 pt-2 border-t border-gray-700">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowAllHours(null)
                                }}
                                className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                              >
                                Ver menos ↑
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Leyenda */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span>Seleccionado</span>
              </div>
            </div>

            {loading && (
              <div className="mt-2 text-xs text-gray-500 text-center">
                Cargando horarios...
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
