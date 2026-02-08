"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PatientSearchInput } from "@/components/forms/patient-search-input"
import { CalendarWithAvailability } from "@/components/forms/calendar-with-availability"
import { HourSelectorPopup } from "@/components/forms/hour-selector-popup"
import { getSmartDefaultsFromStorage, saveSmartDefaults } from "@/lib/smart-defaults"
import { useAnalytics } from "@/lib/analytics"
import Link from "next/link"

export default function NuevoTurnoAdminPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { timeStart, timeEnd, trackFormAbandon } = useAnalytics()
  const [profesionales, setProfesionales] = useState<any[]>([])
  const [pacientes, setPacientes] = useState<any[]>([])
  const [horariosDisponibles, setHorariosDisponibles] = useState<any[]>([])
  const [obrasSociales, setObrasSociales] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null)
  const [formData, setFormData] = useState({
    pacienteId: "",
    profesionalId: "",
    fecha: "",
    hora: "",
    motivo: "",
    obraSocialId: "",
    obraSocial: "",
    consultorioProfesionalId: "",
  })
  const [fieldsCompleted, setFieldsCompleted] = useState(0)

  useEffect(() => {
    timeStart("create_appointment_form")
    fetchData()
    
    // Cargar smart defaults
    if (session?.user?.id) {
      const defaults = getSmartDefaultsFromStorage(session.user.id)
      if (defaults?.ultimoProfesionalId) {
        setFormData((prev) => ({
          ...prev,
          profesionalId: defaults.ultimoProfesionalId || "",
        }))
      }
    }

    return () => {
      // Trackear abandono si no se completó
      if (fieldsCompleted < 3) {
        trackFormAbandon("create_appointment", fieldsCompleted, 7)
      }
    }
  }, [session, timeStart, trackFormAbandon, fieldsCompleted])

  useEffect(() => {
    if (formData.profesionalId && formData.fecha) {
      fetchHorariosDisponibles()
      // Limpiar hora cuando cambia profesional o fecha
      setFormData(prev => ({ ...prev, hora: "" }))
    }
  }, [formData.profesionalId, formData.fecha])

  const fetchData = async () => {
    try {
      const [profesionalesRes, pacientesRes, obrasSocialesRes] = await Promise.all([
        fetch("/api/profesionales"),
        fetch("/api/pacientes"),
        fetch("/api/obras-sociales/activas"),
      ])
      const profesionalesData = await profesionalesRes.json()
      const pacientesData = await pacientesRes.json()
      const obrasSocialesData = await obrasSocialesRes.json()
      setProfesionales(profesionalesData)
      setPacientes(pacientesData)
      setObrasSociales(obrasSocialesData)
    } catch (error) {
      console.error("Error cargando datos:", error)
    }
  }

  const fetchHorariosDisponibles = async () => {
    try {
      const response = await fetch(
        `/api/horarios/disponibles?profesionalId=${formData.profesionalId}&fecha=${formData.fecha}`
      )
      const data = await response.json()
      setHorariosDisponibles(data.horarios || [])
    } catch (error) {
      console.error("Error cargando horarios:", error)
    }
  }

  useEffect(() => {
    // Contar campos completados
    let completed = 0
    if (formData.pacienteId) completed++
    if (formData.profesionalId) completed++
    if (formData.fecha) completed++
    if (formData.hora) completed++
    if (formData.motivo) completed++
    if (formData.obraSocialId || formData.obraSocial) completed++
    setFieldsCompleted(completed)
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación de campos requeridos
    if (!formData.pacienteId) {
      alert("Por favor seleccione un paciente")
      return
    }
    if (!formData.profesionalId) {
      alert("Por favor seleccione un profesional")
      return
    }
    if (!formData.fecha) {
      alert("Por favor seleccione una fecha")
      return
    }
    if (!formData.hora || formData.hora.trim() === "" || formData.hora === "manual") {
      alert("Por favor ingrese una hora para el turno")
      return
    }
    
    // Validar formato de hora (HH:MM)
    const horaRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    if (!horaRegex.test(formData.hora)) {
      alert("Por favor ingrese una hora válida en formato HH:MM (ejemplo: 09:00, 14:30)")
      return
    }
    
    setLoading(true)

    try {
      timeStart("create_appointment_api")
      const response = await fetch("/api/turnos/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          pacienteId: formData.pacienteId,
        }),
      })

      // Verificar si la respuesta es válida antes de intentar parsear JSON
      if (!response.ok) {
        let errorMessage = "Error al crear turno"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
        } catch {
          // Si no se puede parsear el JSON, usar el texto de la respuesta
          const text = await response.text()
          errorMessage = text || errorMessage
        }
        timeEnd("create_appointment_api", { success: false })
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Guardar smart defaults
      if (session?.user?.id) {
        saveSmartDefaults(session.user.id, {
          ultimoProfesionalId: formData.profesionalId,
          ultimaObraSocialId: formData.obraSocialId || null,
        })
      }

      timeEnd("create_appointment_form", { success: true })
      timeEnd("create_appointment_api", { success: true })
      router.push("/dashboard/admin/turnos")
    } catch (error: any) {
      console.error("Error creando turno:", error)
      alert(error.message || "Error al crear turno. Por favor, intente nuevamente.")
      setLoading(false)
    } finally {
      // Asegurar que siempre se resetee el loading, incluso si hay un error inesperado
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Crear Nuevo Turno</h1>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Turno</CardTitle>
          <CardDescription>
            Complete los datos para crear un turno
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pacienteId">Paciente *</Label>
              <PatientSearchInput
                onChange={(paciente) => {
                  if (paciente) {
                    setFormData({ ...formData, pacienteId: paciente.id })
                    setSelectedPaciente(paciente)
                  } else {
                    setFormData({ ...formData, pacienteId: "" })
                    setSelectedPaciente(null)
                  }
                }}
                autoFocus={true}
                placeholder="Buscar paciente por nombre, DNI o email..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profesionalId">Profesional *</Label>
              <select
                id="profesionalId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.profesionalId}
                onChange={(e) =>
                  setFormData({ ...formData, profesionalId: e.target.value })
                }
                required
              >
                <option value="">Seleccione un profesional</option>
                {profesionales.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.user.nombre} - {prof.especialidad}
                  </option>
                ))}
              </select>
            </div>

            {formData.profesionalId ? (
              <CalendarWithAvailability
                profesionalId={formData.profesionalId}
                value={formData.fecha}
                onChange={(date) => {
                  setFormData({ ...formData, fecha: date, hora: "" })
                }}
                onHourSelect={(hour) => {
                  setFormData({ ...formData, hora: hour })
                }}
                minDate={new Date().toISOString().split("T")[0]}
              />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  required
                  disabled
                />
                <p className="text-xs text-gray-500">
                  Primero seleccione un profesional para ver los días disponibles
                </p>
              </div>
            )}

            {formData.fecha && formData.profesionalId && (
              <HourSelectorPopup
                profesionalId={formData.profesionalId}
                fecha={formData.fecha}
                value={formData.hora}
                onChange={(hour) => {
                  setFormData({ ...formData, hora: hour })
                }}
              />
            )}

            <div className="space-y-2">
              <Label htmlFor="obraSocialId">Obra Social (opcional)</Label>
              <select
                id="obraSocialId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.obraSocialId}
                onChange={(e) => {
                  const selectedObraSocial = obrasSociales.find(os => os.id === e.target.value)
                  setFormData({
                    ...formData,
                    obraSocialId: e.target.value,
                    obraSocial: selectedObraSocial ? selectedObraSocial.nombre : "",
                  })
                }}
              >
                <option value="">Seleccione una obra social</option>
                {obrasSociales.map((obraSocial) => (
                  <option key={obraSocial.id} value={obraSocial.id}>
                    {obraSocial.nombre} {obraSocial.codigo ? `(${obraSocial.codigo})` : ""}
                  </option>
                ))}
              </select>
              {obrasSociales.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No hay obras sociales disponibles. Puede ingresar una manualmente.
                </p>
              )}
              {formData.obraSocialId === "" && (
                <Input
                  id="obraSocial"
                  placeholder="O ingrese el nombre manualmente"
                  value={formData.obraSocial}
                  onChange={(e) =>
                    setFormData({ ...formData, obraSocial: e.target.value })
                  }
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de la consulta (opcional)</Label>
              <textarea
                id="motivo"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.motivo}
                onChange={(e) =>
                  setFormData({ ...formData, motivo: e.target.value })
                }
              />
            </div>

            <div className="flex gap-4 pt-6 border-t border-[#E2E8F0]">
              <Button 
                type="submit" 
                disabled={loading || !formData.pacienteId || !formData.profesionalId || !formData.fecha || !formData.hora || formData.hora.trim() === "" || formData.hora === "manual"}
                className="bg-[#2563EB] hover:bg-[#1E40AF] text-white px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creando..." : "Crear Turno"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="border-[#E2E8F0] hover:bg-[#F8FAFC] px-6 py-2"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  router.push("/dashboard/admin")
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
