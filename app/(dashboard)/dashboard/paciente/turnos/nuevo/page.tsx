"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NuevoTurnoPage() {
  const router = useRouter()
  const [profesionales, setProfesionales] = useState<any[]>([])
  const [horariosDisponibles, setHorariosDisponibles] = useState<any[]>([])
  const [obrasSociales, setObrasSociales] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    profesionalId: "",
    fecha: "",
    hora: "",
    motivo: "",
    obraSocialId: "",
    obraSocial: "",
  })

  useEffect(() => {
    fetchProfesionales()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial
  }, [])

  useEffect(() => {
    if (formData.profesionalId && formData.fecha) {
      fetchHorariosDisponibles()
      // Limpiar hora cuando cambia profesional o fecha
      setFormData(prev => ({ ...prev, hora: "" }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchHorariosDisponibles usa formData
  }, [formData.profesionalId, formData.fecha])

  const fetchProfesionales = async () => {
    try {
      const [profesionalesRes, obrasSocialesRes] = await Promise.all([
        fetch("/api/profesionales"),
        fetch("/api/obras-sociales/activas"),
      ])
      const profesionalesData = await profesionalesRes.json()
      const obrasSocialesData = await obrasSocialesRes.json()
      setProfesionales(Array.isArray(profesionalesData) ? profesionalesData : [])
      setObrasSociales(Array.isArray(obrasSocialesData) ? obrasSocialesData : [])
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación de campos requeridos
    if (!formData.profesionalId) {
      alert("Por favor seleccione un profesional")
      return
    }
    if (!formData.fecha) {
      alert("Por favor seleccione una fecha")
      return
    }
    if (!formData.hora || formData.hora.trim() === "") {
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
      const response = await fetch("/api/turnos/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          obraSocialId: formData.obraSocialId === "SIN_OBRA_SOCIAL" ? "" : formData.obraSocialId,
          obraSocial: formData.obraSocialId === "SIN_OBRA_SOCIAL" ? "No tengo obra social" : formData.obraSocial,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear turno")
      }

      router.push("/dashboard/paciente/turnos")
    } catch (error: any) {
      alert(error.message || "Error al crear turno")
      setLoading(false)
    }
  }

  const profesionalSeleccionado = profesionales.find(
    (p) => p.id === formData.profesionalId
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Solicitar Nuevo Turno</h1>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Turno</CardTitle>
          <CardDescription>
            Complete los datos para solicitar su turno
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {profesionalSeleccionado && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm">
                  <strong>Especialidad:</strong> {profesionalSeleccionado.especialidad}
                </p>
                {profesionalSeleccionado.atiendeObraSocial && (
                  <p className="text-sm">
                    <strong>Atiende obra social:</strong> Sí
                  </p>
                )}
              </div>
            )}

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
              />
            </div>

            {formData.fecha && formData.profesionalId && (
              <div className="space-y-2">
                <Label htmlFor="hora">Hora *</Label>
                {horariosDisponibles.length > 0 ? (
                  <>
                    <select
                      id="hora"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-2"
                      value={formData.hora}
                      onChange={(e) =>
                        setFormData({ ...formData, hora: e.target.value })
                      }
                      required
                    >
                      <option value="">Seleccione una hora disponible</option>
                      {horariosDisponibles.map((horario) => (
                        <option key={horario} value={horario}>
                          {horario}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 border-t"></div>
                      <span className="text-xs text-gray-500">O</span>
                      <div className="flex-1 border-t"></div>
                    </div>
                    <Input
                      type="time"
                      name="hora"
                      value={formData.hora}
                      onChange={(e) => {
                        const horaValue = e.target.value
                        setFormData({ ...formData, hora: horaValue })
                      }}
                      className="mt-2"
                      placeholder="O ingrese una hora manualmente"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Puede seleccionar una hora disponible o ingresar una hora manualmente (formato HH:MM)
                    </p>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-2">
                      <p className="text-sm text-yellow-800">
                        No hay horarios configurados para este día. Puede ingresar una hora manualmente.
                      </p>
                    </div>
                    <Input
                      type="time"
                      id="hora"
                      name="hora"
                      value={formData.hora}
                      onChange={(e) => {
                        const horaValue = e.target.value
                        setFormData({ ...formData, hora: horaValue })
                      }}
                      required
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ingrese la hora en formato HH:MM (ejemplo: 09:00, 14:30)
                    </p>
                  </>
                )}
              </div>
            )}

            {formData.fecha && formData.profesionalId && horariosDisponibles.length === 0 && (
              <div className="space-y-2">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-2">
                  <p className="text-sm text-yellow-800">
                    No hay horarios configurados para este día. Puede ingresar una hora manualmente.
                  </p>
                </div>
                <Input
                  type="time"
                  id="hora"
                  name="hora"
                  value={formData.hora}
                  onChange={(e) => {
                    const horaValue = e.target.value
                    setFormData({ ...formData, hora: horaValue })
                  }}
                  required
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ingrese la hora en formato HH:MM (ejemplo: 09:00, 14:30)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="obraSocialId">Obra Social (opcional)</Label>
              <select
                id="obraSocialId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.obraSocialId}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === "SIN_OBRA_SOCIAL") {
                    setFormData({ ...formData, obraSocialId: "SIN_OBRA_SOCIAL", obraSocial: "No tengo obra social" })
                    return
                  }
                  const selectedObraSocial = obrasSociales.find(os => os.id === val)
                  setFormData({
                    ...formData,
                    obraSocialId: val,
                    obraSocial: selectedObraSocial ? selectedObraSocial.nombre : "",
                  })
                }}
              >
                <option value="">Seleccione una obra social</option>
                <option value="SIN_OBRA_SOCIAL">No tengo obra social</option>
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
              {formData.obraSocialId !== "SIN_OBRA_SOCIAL" && formData.obraSocialId === "" && (
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

            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={loading || !formData.profesionalId || !formData.fecha || !formData.hora || formData.hora.trim() === ""}
              >
                {loading ? "Solicitando..." : "Solicitar Turno"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  router.push("/dashboard/paciente")
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
