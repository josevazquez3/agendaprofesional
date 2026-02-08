"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, Download, FileSpreadsheet, FileText, X } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface TurnoSeleccionado {
  fecha: string
  hora: string
  pacienteId: string
  pacienteNombre: string
  profesionalId: string
}

export default function CalendarioTurnosPage() {
  const [fechaActual, setFechaActual] = useState(new Date())
  const [diasSeleccionados, setDiasSeleccionados] = useState<Date[]>([])
  const [modoSeleccion, setModoSeleccion] = useState<"dia" | "semana" | "mes">("dia")
  const [profesionales, setProfesionales] = useState<any[]>([])
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState("")
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([])
  const [horaSeleccionada, setHoraSeleccionada] = useState("")
  const [turnos, setTurnos] = useState<any[]>([])
  const [turnosSeleccionados, setTurnosSeleccionados] = useState<TurnoSeleccionado[]>([])
  const [pacientes, setPacientes] = useState<any[]>([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  useEffect(() => {
    fetchProfesionales()
    fetchPacientes()
  }, [])

  useEffect(() => {
    if (profesionalSeleccionado) {
      fetchTurnos()
    }
  }, [profesionalSeleccionado, fechaActual])

  useEffect(() => {
    if (profesionalSeleccionado && diasSeleccionados.length > 0) {
      const primeraFecha = diasSeleccionados[0]
      fetchHorariosDisponibles(primeraFecha)
    }
  }, [profesionalSeleccionado, diasSeleccionados])

  const fetchProfesionales = async () => {
    try {
      const response = await fetch("/api/profesionales")
      const data = await response.json()
      setProfesionales(data)
    } catch (error) {
      console.error("Error cargando profesionales:", error)
    }
  }

  const fetchPacientes = async () => {
    try {
      const response = await fetch("/api/pacientes")
      const data = await response.json()
      setPacientes(data)
    } catch (error) {
      console.error("Error cargando pacientes:", error)
    }
  }

  const fetchTurnos = async () => {
    try {
      const inicioMes = startOfMonth(fechaActual)
      const finMes = endOfMonth(fechaActual)
      const response = await fetch(
        `/api/turnos?profesionalId=${profesionalSeleccionado}&fechaInicio=${inicioMes.toISOString()}&fechaFin=${finMes.toISOString()}`
      )
      const data = await response.json()
      setTurnos(data.turnos || [])
    } catch (error) {
      console.error("Error cargando turnos:", error)
    }
  }

  const fetchHorariosDisponibles = async (fecha: Date) => {
    try {
      const response = await fetch(
        `/api/horarios/disponibles?profesionalId=${profesionalSeleccionado}&fecha=${fecha.toISOString().split("T")[0]}`
      )
      const data = await response.json()
      setHorariosDisponibles(data.horarios || [])
      if (data.horarios && data.horarios.length > 0) {
        setHoraSeleccionada(data.horarios[0])
      }
    } catch (error) {
      console.error("Error cargando horarios:", error)
    }
  }

  const obtenerDiasDelMes = () => {
    const inicioSemana = startOfWeek(startOfMonth(fechaActual), { weekStartsOn: 1 })
    const finSemana = endOfWeek(endOfMonth(fechaActual), { weekStartsOn: 1 })
    return eachDayOfInterval({ start: inicioSemana, end: finSemana })
  }

  const tieneTurno = (fecha: Date) => {
    return turnos.some((turno) => {
      const fechaTurno = new Date(turno.fecha)
      return isSameDay(fechaTurno, fecha) && turno.estado !== "CANCELADO"
    })
  }

  const estaSeleccionado = (fecha: Date) => {
    return diasSeleccionados.some((dia) => isSameDay(dia, fecha))
  }

  const esDelMesActual = (fecha: Date) => {
    return fecha.getMonth() === fechaActual.getMonth()
  }

  const manejarClickDia = (fecha: Date, event?: React.MouseEvent) => {
    if (!esDelMesActual(fecha)) return

    // Verificar si se está presionando Ctrl o Cmd (para selección múltiple)
    const isMultiSelect = event?.ctrlKey || event?.metaKey

    if (modoSeleccion === "dia") {
      if (estaSeleccionado(fecha)) {
        // Si está seleccionado, quitarlo de la lista
        setDiasSeleccionados((prev) =>
          prev.filter((dia) => !isSameDay(dia, fecha))
        )
      } else {
        // Si no está seleccionado, agregarlo a la lista
        if (isMultiSelect || diasSeleccionados.length > 0) {
          // Modo selección múltiple: agregar a la lista existente
          setDiasSeleccionados((prev) => [...prev, fecha])
        } else {
          // Modo selección simple: reemplazar la lista
          setDiasSeleccionados([fecha])
        }
      }
    } else if (modoSeleccion === "semana") {
      const inicioSemana = startOfWeek(fecha, { weekStartsOn: 1 })
      const finSemana = endOfWeek(fecha, { weekStartsOn: 1 })
      const diasSemana = eachDayOfInterval({ start: inicioSemana, end: finSemana })
      const diasFiltrados = diasSemana.filter((d) => esDelMesActual(d))
      
      if (isMultiSelect) {
        // Agregar semana a la selección existente
        setDiasSeleccionados((prev) => {
          const nuevosDias = diasFiltrados.filter(
            (dia) => !prev.some((d) => isSameDay(d, dia))
          )
          return [...prev, ...nuevosDias]
        })
      } else {
        // Reemplazar con la semana seleccionada
        setDiasSeleccionados(diasFiltrados)
      }
    } else if (modoSeleccion === "mes") {
      const inicioMes = startOfMonth(fechaActual)
      const finMes = endOfMonth(fechaActual)
      const diasMes = eachDayOfInterval({ start: inicioMes, end: finMes })
      
      if (isMultiSelect) {
        // Agregar mes a la selección existente
        setDiasSeleccionados((prev) => {
          const nuevosDias = diasMes.filter(
            (dia) => !prev.some((d) => isSameDay(d, dia))
          )
          return [...prev, ...nuevosDias]
        })
      } else {
        // Reemplazar con el mes seleccionado
        setDiasSeleccionados(diasMes)
      }
    }
  }

  const agregarTurno = (pacienteId: string, pacienteNombre: string) => {
    if (!horaSeleccionada || diasSeleccionados.length === 0) {
      alert("Seleccione al menos un día y una hora")
      return
    }

    // Verificar que no haya conflictos con turnos existentes
    const turnosExistentes = turnos.filter((t) => {
      const fechaTurno = new Date(t.fecha)
      return (
        diasSeleccionados.some((dia) => isSameDay(fechaTurno, dia)) &&
        t.hora === horaSeleccionada &&
        t.estado !== "CANCELADO"
      )
    })

    if (turnosExistentes.length > 0) {
      alert(
        `Algunos días ya tienen turnos en el horario ${horaSeleccionada}. Por favor, seleccione otros días u horarios.`
      )
      return
    }

    const nuevosTurnos: TurnoSeleccionado[] = diasSeleccionados.map((dia) => ({
      fecha: format(dia, "yyyy-MM-dd"),
      hora: horaSeleccionada,
      pacienteId,
      pacienteNombre,
      profesionalId: profesionalSeleccionado,
    }))

    setTurnosSeleccionados([...turnosSeleccionados, ...nuevosTurnos])
    setDiasSeleccionados([])
    setMostrarFormulario(false)
  }

  const eliminarTurno = (index: number) => {
    setTurnosSeleccionados(turnosSeleccionados.filter((_, i) => i !== index))
  }

  const guardarTurnos = async () => {
    if (turnosSeleccionados.length === 0) {
      alert("No hay turnos para guardar")
      return
    }

    try {
      const resultados = []
      let exitosos = 0
      let fallidos = 0

      for (const turno of turnosSeleccionados) {
        try {
          const response = await fetch("/api/turnos/crear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pacienteId: turno.pacienteId,
              profesionalId: turno.profesionalId,
              fecha: turno.fecha,
              hora: turno.hora,
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            fallidos++
            resultados.push({
              fecha: turno.fecha,
              hora: turno.hora,
              paciente: turno.pacienteNombre,
              error: data.error || "Error desconocido",
            })
          } else {
            exitosos++
          }
        } catch (error: any) {
          fallidos++
          resultados.push({
            fecha: turno.fecha,
            hora: turno.hora,
            paciente: turno.pacienteNombre,
            error: error.message || "Error al crear turno",
          })
        }
      }

      if (fallidos > 0) {
        const mensajeErrores = resultados
          .filter((r) => r.error)
          .map((r) => `${r.fecha} ${r.hora} - ${r.paciente}: ${r.error}`)
          .join("\n")
        alert(
          `Se crearon ${exitosos} turnos exitosamente.\n\nErrores (${fallidos}):\n${mensajeErrores}`
        )
      } else {
        alert(`${exitosos} turnos creados exitosamente`)
      }

      setTurnosSeleccionados([])
      await fetchTurnos()
    } catch (error: any) {
      console.error("Error guardando turnos:", error)
      alert(`Error al guardar turnos: ${error.message || "Error desconocido"}`)
    }
  }

  const exportarExcel = async () => {
    if (turnosSeleccionados.length === 0) {
      alert("No hay turnos para exportar")
      return
    }

    try {
      // Obtener datos completos de los turnos
      const turnosCompletos = await Promise.all(
        turnosSeleccionados.map(async (turno) => {
          const profesional = profesionales.find((p) => p.id === turno.profesionalId)
          return {
            ...turno,
            profesionalNombre: profesional?.user?.nombre || "N/A",
          }
        })
      )

      const response = await fetch("/api/turnos/exportar/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnos: turnosCompletos }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al exportar a Excel")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `turnos_${format(new Date(), "yyyy-MM-dd")}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error.message || "Error al exportar a Excel")
    }
  }

  const exportarPDF = async () => {
    if (turnosSeleccionados.length === 0) {
      alert("No hay turnos para exportar")
      return
    }

    try {
      // Obtener datos completos de los turnos
      const turnosCompletos = await Promise.all(
        turnosSeleccionados.map(async (turno) => {
          const profesional = profesionales.find((p) => p.id === turno.profesionalId)
          return {
            ...turno,
            profesionalNombre: profesional?.user?.nombre || "N/A",
          }
        })
      )

      const response = await fetch("/api/turnos/exportar/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnos: turnosCompletos }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al exportar a PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `turnos_${format(new Date(), "yyyy-MM-dd")}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error.message || "Error al exportar a PDF")
    }
  }

  const dias = obtenerDiasDelMes()
  const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/secretaria/turnos">
            <Button variant="outline" size="sm">← Volver</Button>
          </Link>
          <h1 className="text-3xl font-bold">Calendario de Turnos</h1>
        </div>
        <div className="flex gap-2">
          {turnosSeleccionados.length > 0 && (
            <>
              <Button onClick={exportarExcel} variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              <Button onClick={exportarPDF} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Profesional</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={profesionalSeleccionado}
                onChange={(e) => setProfesionalSeleccionado(e.target.value)}
              >
                <option value="">Seleccione un profesional</option>
                {profesionales.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.user.nombre} - {prof.especialidad}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Modo de Selección</Label>
              <div className="flex gap-2">
                <Button
                  variant={modoSeleccion === "dia" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setModoSeleccion("dia")
                    setDiasSeleccionados([])
                  }}
                >
                  Día (Múltiple)
                </Button>
                <Button
                  variant={modoSeleccion === "semana" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setModoSeleccion("semana")
                    setDiasSeleccionados([])
                  }}
                >
                  Semana
                </Button>
                <Button
                  variant={modoSeleccion === "mes" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setModoSeleccion("mes")
                    setDiasSeleccionados([])
                  }}
                >
                  Mes
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {modoSeleccion === "dia" 
                  ? "Haz clic en los días para seleccionarlos. Mantén Ctrl/Cmd para agregar más días."
                  : modoSeleccion === "semana"
                  ? "Haz clic en un día para seleccionar toda la semana."
                  : "Haz clic en cualquier día para seleccionar todo el mes."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {profesionalSeleccionado && (
        <>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {format(fechaActual, "MMMM yyyy", { locale: es })}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFechaActual(subMonths(fechaActual, 1))}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFechaActual(new Date())}
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFechaActual(addMonths(fechaActual, 1))}
                  >
                    →
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {diasSemana.map((dia) => (
                  <div key={dia} className="text-center text-sm font-semibold p-2">
                    {dia}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {dias.map((dia, index) => {
                  const tieneTurnoDia = tieneTurno(dia)
                  const seleccionado = estaSeleccionado(dia)
                  const esDelMes = esDelMesActual(dia)

                  return (
                    <button
                      key={index}
                      onClick={(e) => manejarClickDia(dia, e)}
                      className={`
                        aspect-square p-2 rounded-md text-sm transition-colors
                        ${!esDelMes ? "text-gray-300" : ""}
                        ${seleccionado ? "bg-blue-500 text-white font-bold" : ""}
                        ${!seleccionado && tieneTurnoDia && esDelMes ? "bg-blue-200 text-blue-900" : ""}
                        ${!seleccionado && !tieneTurnoDia && esDelMes ? "bg-white hover:bg-gray-100 border border-gray-200" : ""}
                        ${!esDelMes ? "bg-gray-50" : ""}
                      `}
                      title={seleccionado ? "Clic para deseleccionar" : "Clic para seleccionar (Ctrl/Cmd para múltiple)"}
                    >
                      {format(dia, "d")}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border border-gray-200"></div>
                  <span>Libre</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-200"></div>
                  <span>Con Turnos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500"></div>
                  <span>Seleccionado</span>
                </div>
                {diasSeleccionados.length > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDiasSeleccionados([])}
                    >
                      Limpiar Selección ({diasSeleccionados.length})
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {diasSeleccionados.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Configurar Turnos</CardTitle>
                <CardDescription>
                  {diasSeleccionados.length} día(s) seleccionado(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horario</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={horaSeleccionada}
                      onChange={(e) => setHoraSeleccionada(e.target.value)}
                    >
                      <option value="">Seleccione un horario</option>
                      {horariosDisponibles.map((hora) => (
                        <option key={hora} value={hora}>
                          {hora}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Paciente</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      onChange={(e) => {
                        const pacienteId = e.target.value
                        const paciente = pacientes.find((p) => p.id === pacienteId)
                        if (paciente && horaSeleccionada) {
                          agregarTurno(pacienteId, paciente.nombre)
                        }
                      }}
                    >
                      <option value="">Seleccione un paciente</option>
                      {pacientes.map((paciente) => (
                        <option key={paciente.id} value={paciente.id}>
                          {paciente.nombre} - {paciente.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {turnosSeleccionados.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Turnos Seleccionados ({turnosSeleccionados.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {turnosSeleccionados.map((turno, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{turno.pacienteNombre}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(turno.fecha), "dd/MM/yyyy", { locale: es })} - {turno.hora}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarTurno(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button onClick={guardarTurnos} className="w-full">
                    Guardar {turnosSeleccionados.length} Turno(s)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
