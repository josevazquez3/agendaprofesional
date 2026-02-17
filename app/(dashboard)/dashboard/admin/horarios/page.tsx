"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, CheckCircle, XCircle } from "lucide-react"
import { BloqueoDiaModal } from "@/components/secretaria/BloqueoDiaModal"

const DIAS_SEMANA = [
  { value: "LUNES", label: "Lunes" },
  { value: "MARTES", label: "Martes" },
  { value: "MIERCOLES", label: "Miércoles" },
  { value: "JUEVES", label: "Jueves" },
  { value: "VIERNES", label: "Viernes" },
  { value: "SABADO", label: "Sábado" },
  { value: "DOMINGO", label: "Domingo" },
]

export default function AdminHorariosPage() {
  const [profesionales, setProfesionales] = useState<any[]>([])
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState("")
  const [horarios, setHorarios] = useState<any[]>([])
  const [bloqueos, setBloqueos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showBloqueoModal, setShowBloqueoModal] = useState(false)
  const [diaBloqueo, setDiaBloqueo] = useState("")
  const [formData, setFormData] = useState({
    diaSemana: "",
    horaInicio: "",
    horaFin: "",
    duracionTurno: 30,
  })

  useEffect(() => {
    fetchProfesionales()
  }, [])

  useEffect(() => {
    if (profesionalSeleccionado) {
      fetchHorarios()
      fetchBloqueos()
    }
  }, [profesionalSeleccionado])

  const fetchProfesionales = async () => {
    try {
      const response = await fetch("/api/profesionales")
      const data = await response.json()
      setProfesionales(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error cargando profesionales:", error)
    }
  }

  const fetchHorarios = async () => {
    try {
      const response = await fetch(`/api/horarios?profesionalId=${profesionalSeleccionado}`)
      const data = await response.json()
      setHorarios(data)
    } catch (error) {
      console.error("Error cargando horarios:", error)
    }
  }

  const fetchBloqueos = async () => {
    try {
      const response = await fetch(`/api/horarios/bloqueos?profesionalId=${profesionalSeleccionado}`)
      const data = await response.json()
      setBloqueos(data)
    } catch (error) {
      console.error("Error cargando bloqueos:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          profesionalId: profesionalSeleccionado,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al crear horario")
      }

      await fetchHorarios()
      setFormData({
        diaSemana: "",
        horaInicio: "",
        horaFin: "",
        duracionTurno: 30,
      })
    } catch (error) {
      alert("Error al crear horario")
    } finally {
      setLoading(false)
    }
  }

  const toggleHorario = async (horarioId: string, activo: boolean) => {
    try {
      const response = await fetch("/api/horarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: horarioId, activo: !activo }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar horario")
      }

      await fetchHorarios()
    } catch (error) {
      alert("Error al actualizar horario")
    }
  }

  const handleBloquearDia = (dia: string) => {
    setDiaBloqueo(dia)
    setShowBloqueoModal(true)
  }

  const handleEliminarBloqueo = async (bloqueoId: string) => {
    if (!confirm("¿Estás seguro de eliminar este bloqueo?")) {
      return
    }

    try {
      const response = await fetch("/api/horarios/bloqueos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bloqueoId }),
      })

      if (!response.ok) {
        throw new Error("Error al eliminar bloqueo")
      }

      await fetchBloqueos()
    } catch (error) {
      alert("Error al eliminar bloqueo")
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Horarios</h1>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Profesional</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {profesionalSeleccionado && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Agregar Horario</CardTitle>
              <CardDescription>
                Configure los horarios de atención por día de la semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diaSemana">Día de la Semana *</Label>
                    <select
                      id="diaSemana"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formData.diaSemana}
                      onChange={(e) =>
                        setFormData({ ...formData, diaSemana: e.target.value })
                      }
                      required
                    >
                      <option value="">Seleccione un día</option>
                      {DIAS_SEMANA.map((dia) => (
                        <option key={dia.value} value={dia.value}>
                          {dia.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duracionTurno">Duración del Turno (minutos) *</Label>
                    <Input
                      id="duracionTurno"
                      type="number"
                      min="15"
                      step="15"
                      value={formData.duracionTurno}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duracionTurno: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="horaInicio">Hora de Inicio *</Label>
                    <Input
                      id="horaInicio"
                      type="time"
                      value={formData.horaInicio}
                      onChange={(e) =>
                        setFormData({ ...formData, horaInicio: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="horaFin">Hora de Fin *</Label>
                    <Input
                      id="horaFin"
                      type="time"
                      value={formData.horaFin}
                      onChange={(e) =>
                        setFormData({ ...formData, horaFin: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Agregar Horario"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horarios Configurados</CardTitle>
            </CardHeader>
            <CardContent>
              {horarios.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay horarios configurados
                </div>
              ) : (
                <div className="space-y-4">
                  {horarios.map((horario) => (
                    <div
                      key={horario.id}
                      className="flex justify-between items-center p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <p className="font-semibold">
                            {DIAS_SEMANA.find((d) => d.value === horario.diaSemana)?.label}
                          </p>
                          <p className="text-sm text-gray-600">
                            {horario.horaInicio} - {horario.horaFin} ({horario.duracionTurno} min)
                          </p>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              horario.activo
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {horario.activo ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={horario.activo ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleHorario(horario.id, horario.activo)}
                        >
                          {horario.activo ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Deshabilitar
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Habilitar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBloquearDia(horario.diaSemana)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Bloquear Día
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Días Bloqueados</CardTitle>
            </CardHeader>
            <CardContent>
              {bloqueos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay días bloqueados
                </div>
              ) : (
                <div className="space-y-2">
                  {bloqueos.map((bloqueo) => (
                    <div
                      key={bloqueo.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {new Date(bloqueo.fecha).toLocaleDateString("es-AR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-gray-600">
                          {bloqueo.horaInicio} - {bloqueo.horaFin}
                        </p>
                        {bloqueo.motivo && (
                          <p className="text-sm text-gray-500">Motivo: {bloqueo.motivo}</p>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleEliminarBloqueo(bloqueo.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {showBloqueoModal && (
        <BloqueoDiaModal
          profesionalId={profesionalSeleccionado}
          diaSemana={diaBloqueo}
          onClose={() => {
            setShowBloqueoModal(false)
            setDiaBloqueo("")
          }}
          onSuccess={() => {
            fetchBloqueos()
            setShowBloqueoModal(false)
            setDiaBloqueo("")
          }}
        />
      )}
    </div>
  )
}
