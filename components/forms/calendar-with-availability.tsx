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
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (profesionalId) {
      fetchDiasDisponibles()
    } else {
      setDiasDisponibles({})
    }
  }, [profesionalId, currentMonth])

  // Al abrir el calendario, recargar días para asegurar que se vean en azul
  useEffect(() => {
    if (showCalendar && profesionalId) {
      fetchDiasDisponibles()
    }
  }, [showCalendar])


  const toDateKey = (d: Date) => {
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const day = d.getDate()
    return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const fetchDiasDisponibles = async () => {
    if (!profesionalId) {
      setFetchError(null)
      return
    }
    setFetchError(null)
    setLoading(true)
    try {
      const mesActual = currentMonth.getMonth() + 1
      const anioActual = currentMonth.getFullYear()
      const mesSiguiente = currentMonth.getMonth() + 2
      const anioSiguiente = mesSiguiente > 12 ? anioActual + 1 : anioActual
      const mesSiguienteAjustado = mesSiguiente > 12 ? 1 : mesSiguiente

      const [resActual, resSiguiente] = await Promise.all([
        fetch(
          `/api/horarios/dias-disponibles?profesionalId=${profesionalId}&mes=${mesActual}&anio=${anioActual}`,
          { cache: "no-store" }
        ),
        fetch(
          `/api/horarios/dias-disponibles?profesionalId=${profesionalId}&mes=${mesSiguienteAjustado}&anio=${anioSiguiente}`,
          { cache: "no-store" }
        ),
      ])

      const dataActual = await resActual.json().catch(() => ({}))
      const dataSiguiente = await resSiguiente.json().catch(() => ({}))

      if (!resActual.ok || !resSiguiente.ok) {
        const msg = dataActual.error || dataSiguiente.error || `Error ${resActual.status || resSiguiente.status}`
        setFetchError(typeof msg === "string" ? msg : "Error al cargar días")
      }
      if (dataActual.error && !dataActual.diasDisponibles) {
        setDiasDisponibles(dataSiguiente.diasDisponibles || {})
        return
      }
      if (dataSiguiente.error && !dataSiguiente.diasDisponibles) {
        setDiasDisponibles(dataActual.diasDisponibles || {})
        return
      }

      const diasCombinados = {
        ...(dataActual.diasDisponibles || {}),
        ...(dataSiguiente.diasDisponibles || {}),
      }
      setDiasDisponibles(diasCombinados)
    } catch (error) {
      console.error("Error cargando días disponibles:", error)
      setFetchError("Error de conexión al cargar días")
      setDiasDisponibles({})
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

    // Días del mes actual: "disponible" = el profesional atiende ese día (aunque no queden slots)
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateKey = toDateKey(date)
      const horarios = diasDisponibles[dateKey] ?? []
      const isAvailable = Object.prototype.hasOwnProperty.call(diasDisponibles, dateKey)
      days.push({
        date,
        isCurrentMonth: true,
        isAvailable,
        horarios,
      })
    }

    // Días del mes siguiente para completar la cuadrícula (también consultar disponibilidad)
    const remainingDays = 42 - days.length
    const nextMonthNum = month + 1
    const nextYear = nextMonthNum > 11 ? year + 1 : year
    const nextMonth = nextMonthNum > 11 ? 0 : nextMonthNum
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(nextYear, nextMonth, day)
      const dateKey = toDateKey(date)
      const horarios = diasDisponibles[dateKey] ?? []
      const isAvailable = Object.prototype.hasOwnProperty.call(diasDisponibles, dateKey)
      days.push({
        date,
        isCurrentMonth: false,
        isAvailable,
        horarios,
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
    const dateKey = toDateKey(date)
    const horarios = diasDisponibles[dateKey] || []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const clickedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
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
                const dateKey = toDateKey(day.date)
                const horariosDelDia = diasDisponibles[dateKey] ?? []
                const isAvailableDay = Object.prototype.hasOwnProperty.call(diasDisponibles, dateKey)
                
                const isPastDate = isPast(day.date)
                const isTodayDate = isToday(day.date)
                const isSelectedDate = isSelected(day.date)
                // Permitir seleccionar cualquier día futuro en la grilla (mes actual o siguiente visible)
                const canSelect = !isPastDate
                const canShowTooltip = isAvailableDay && canSelect

                return (
                  <div
                    key={index}
                    className={cn(
                      "relative aspect-square flex items-center justify-center text-sm rounded transition-colors",
                      !day.isCurrentMonth && !isAvailableDay && "text-gray-300 cursor-default",
                      !day.isCurrentMonth && isAvailableDay && !isSelectedDate && "text-blue-800 bg-blue-100 border-2 border-blue-300 hover:bg-blue-200 cursor-pointer",
                      day.isCurrentMonth && isPastDate && "text-gray-400 cursor-not-allowed",
                      day.isCurrentMonth && !isPastDate && !isAvailableDay && !isSelectedDate && "text-gray-600 hover:bg-gray-100 cursor-pointer",
                      day.isCurrentMonth && !isPastDate && isAvailableDay && !isSelectedDate && "bg-blue-100 text-blue-800 font-medium border-2 border-blue-300 hover:bg-blue-200 cursor-pointer",
                      isSelectedDate && "bg-blue-600 text-white font-semibold cursor-pointer border-2 border-blue-700",
                      isTodayDate && !isSelectedDate && !isPastDate && "ring-2 ring-blue-400"
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
                    
                    {/* Tooltip simple solo con cantidad de horarios (sin mostrar los horarios individuales) */}
                    {hoveredDate === dateKey && horariosDelDia.length > 0 && (
                      <div 
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg z-50 whitespace-nowrap"
                      >
                        {horariosDelDia.length} horario{horariosDelDia.length !== 1 ? 's' : ''} disponible{horariosDelDia.length !== 1 ? 's' : ''}
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
                <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
                <span className="text-blue-800 font-medium">Disponible</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-600 border-2 border-blue-700 rounded"></div>
                <span className="text-blue-600 font-medium">Seleccionado</span>
              </div>
            </div>

            {loading && (
              <div className="mt-2 text-xs text-gray-500 text-center">
                Cargando horarios...
              </div>
            )}
            {fetchError && (
              <div className="mt-2 p-2 text-xs text-red-700 bg-red-50 rounded text-center">
                {fetchError}
              </div>
            )}
            {!loading && !fetchError && Object.keys(diasDisponibles).length === 0 && (
              <div className="mt-2 p-2 text-xs text-amber-700 bg-amber-50 rounded text-center">
                Este profesional no tiene días de atención configurados. Agregue horarios en Editar profesional o en Configuración → Horarios.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
