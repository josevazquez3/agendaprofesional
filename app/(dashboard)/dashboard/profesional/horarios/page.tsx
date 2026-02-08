"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    diaSemana: "",
    horaInicio: "",
    horaFin: "",
    duracionTurno: 30,
  })

  useEffect(() => {
    fetchHorarios()
  }, [])

  const fetchHorarios = async () => {
    try {
      const response = await fetch("/api/horarios")
      const data = await response.json()
      setHorarios(data)
    } catch (error) {
      console.error("Error cargando horarios:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Horarios</h1>

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
                  <div>
                    <p className="font-semibold">
                      {DIAS_SEMANA.find((d) => d.value === horario.diaSemana)?.label}
                    </p>
                    <p className="text-sm text-gray-600">
                      {horario.horaInicio} - {horario.horaFin} ({horario.duracionTurno} min)
                    </p>
                  </div>
                  <Button
                    variant={horario.activo ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleHorario(horario.id, horario.activo)}
                  >
                    {horario.activo ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
