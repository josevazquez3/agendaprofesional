"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, XCircle } from "lucide-react"
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

export default function ProfesionalHorariosPage() {
  const [horarios, setHorarios] = useState<any[]>([])
  const [bloqueos, setBloqueos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [error, setError] = useState("")
  const [showBloqueoModal, setShowBloqueoModal] = useState(false)
  const [diaBloqueo, setDiaBloqueo] = useState("")
  const [formData, setFormData] = useState({
    diaSemana: "",
    horaInicio: "",
    horaFin: "",
    duracionTurno: 30,
  })

  useEffect(() => {
    let cancelled = false
    setLoadingInitial(true)
    setError("")
    fetch("/api/horarios")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return
        setLoadingInitial(false)
        if (!ok) {
          setError((data?.error as string) || "Error al cargar horarios")
          setHorarios([])
          return
        }
        setHorarios(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) {
          setLoadingInitial(false)
          setError("Error de conexión al cargar horarios")
          setHorarios([])
        }
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (horarios.length === 0) {
      setBloqueos([])
      return
    }
    let cancelled = false
    fetch("/api/horarios/bloqueos")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return
        if (!ok) return
        setBloqueos(Array.isArray(data) ? data : [])
      })
      .catch(() => { if (!cancelled) setBloqueos([]) })
    return () => { cancelled = true }
  }, [horarios.length])

  const handleBloquearDia = (dia: string) => {
    setDiaBloqueo(dia)
    setShowBloqueoModal(true)
  }

  const handleEliminarBloqueo = async (bloqueoId: string) => {
    if (!confirm("¿Eliminar este bloqueo?")) return
    try {
      const response = await fetch("/api/horarios/bloqueos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bloqueoId }),
      })
      if (!response.ok) throw new Error("Error al eliminar bloqueo")
      await fetchBloqueos()
    } catch (error) {
      alert("Error al eliminar bloqueo")
    }
  }

  const fetchHorarios = async () => {
    const res = await fetch("/api/horarios")
    const data = await res.json()
    if (res.ok) setHorarios(Array.isArray(data) ? data : [])
    else setError((data?.error as string) || "Error al cargar horarios")
  }

  const fetchBloqueos = async () => {
    const res = await fetch("/api/horarios/bloqueos")
    const data = await res.json()
    if (res.ok) setBloqueos(Array.isArray(data) ? data : [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (!response.ok) {
        setError((data?.error as string) || "Error al crear horario")
        return
      }
      await fetchHorarios()
      setFormData({
        diaSemana: "",
        horaInicio: "",
        horaFin: "",
        duracionTurno: 30,
      })
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const toggleHorario = async (horarioId: string, activo: boolean) => {
    setError("")
    try {
      const response = await fetch("/api/horarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: horarioId, activo: !activo }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError((data?.error as string) || "Error al actualizar horario")
        return
      }
      await fetchHorarios()
    } catch {
      setError("Error de conexión")
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Horarios</h1>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Agregar Horario</CardTitle>
          <CardDescription>
            Configure sus horarios de atención por día de la semana
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
                      duracionTurno: parseInt(e.target.value, 10) || 30,
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
          <CardDescription>
            Días y franjas en que atiende. Use &quot;Bloquear día&quot; para feriados, licencias o ausencias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInitial ? (
            <div className="text-center py-8 text-gray-500">Cargando horarios...</div>
          ) : horarios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay horarios configurados. Agregue al menos un día y horario arriba.
            </div>
          ) : (
            <div className="space-y-4">
              {horarios.map((horario) => (
                <div
                  key={horario.id}
                  className="flex flex-wrap justify-between items-center gap-2 p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      {DIAS_SEMANA.find((d) => d.value === horario.diaSemana)?.label}
                    </p>
                    <p className="text-sm text-gray-600">
                      {horario.horaInicio} - {horario.horaFin} ({horario.duracionTurno} min)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleBloquearDia(horario.diaSemana)}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Bloquear día
                    </Button>
                    <Button
                      variant={horario.activo ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleHorario(horario.id, horario.activo)}
                    >
                      {horario.activo ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {horarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Días bloqueados</CardTitle>
            <CardDescription>
              Fechas en que no atiende (feriados, licencias, enfermedad, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bloqueos.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                No hay días bloqueados
              </div>
            ) : (
              <div className="space-y-2">
                {bloqueos.map((bloqueo) => (
                  <div
                    key={bloqueo.id}
                    className="flex justify-between items-center p-3 border rounded-lg bg-gray-50"
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
                        {bloqueo.motivo ? ` · ${bloqueo.motivo}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
      )}

      {showBloqueoModal && horarios[0]?.profesionalId && (
        <BloqueoDiaModal
          profesionalId={horarios[0].profesionalId}
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
