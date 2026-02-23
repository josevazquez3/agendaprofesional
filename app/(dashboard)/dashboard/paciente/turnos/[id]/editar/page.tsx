"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { CalendarWithAvailability } from "@/components/forms/calendar-with-availability"
import { HourSelectorPopup } from "@/components/forms/hour-selector-popup"

export default function ReprogramarTurnoPacientePage() {
  const router = useRouter()
  const params = useParams()
  const turnoId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")
  const [profesionalId, setProfesionalId] = useState("")
  const [formData, setFormData] = useState({
    fecha: "",
    hora: "",
    motivo: "",
  })
  const [profesionalNombre, setProfesionalNombre] = useState("")

  useEffect(() => {
    fetchTurno()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch depende de turnoId
  }, [turnoId])

  const fetchTurno = async () => {
    try {
      const response = await fetch(`/api/turnos/${turnoId}`)
      if (!response.ok) {
        throw new Error("Error al cargar turno")
      }
      const data = await response.json()
      const fechaYMD = data.fecha ? new Date(data.fecha).toISOString().split("T")[0] : ""
      setProfesionalId(data.profesionalId || "")
      setProfesionalNombre(data.profesional?.user?.nombre || "Profesional")
      setFormData({
        fecha: fechaYMD,
        hora: data.hora || "",
        motivo: data.motivo || "",
      })
      setLoadingData(false)
    } catch (error: any) {
      setError(error.message || "Error al cargar turno")
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`/api/turnos/${turnoId}/editar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: formData.fecha,
          hora: formData.hora,
          motivo: formData.motivo,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al reprogramar turno")
      }

      router.push("/dashboard/paciente/turnos")
    } catch (error: any) {
      setError(error.message || "Error al reprogramar turno")
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reprogramar Turno</h1>
        <Link href="/dashboard/paciente/turnos">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar fecha y hora</CardTitle>
          <CardDescription>
            Seleccione una nueva fecha y hora para su turno con {profesionalNombre}. Los días en azul indican disponibilidad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            {profesionalId ? (
              <>
                <div className="space-y-2">
                  <CalendarWithAvailability
                    profesionalId={profesionalId}
                    value={formData.fecha}
                    onChange={(date) =>
                      setFormData({ ...formData, fecha: date, hora: formData.fecha !== date ? "" : formData.hora })
                    }
                    onHourSelect={(hour) => setFormData({ ...formData, hora: hour })}
                    minDate={new Date().toISOString().split("T")[0]}
                    calendarPopupClassName="w-[380px] sm:w-[420px]"
                  />
                </div>
                {formData.fecha && (
                  <div className="space-y-2">
                    <HourSelectorPopup
                      profesionalId={profesionalId}
                      fecha={formData.fecha}
                      value={formData.hora}
                      onChange={(hour) => setFormData({ ...formData, hora: hour })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="motivo">Motivo de la consulta (opcional)</Label>
                  <textarea
                    id="motivo"
                    name="motivo"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.motivo}
                    onChange={(e) =>
                      setFormData({ ...formData, motivo: e.target.value })
                    }
                    placeholder="Describa brevemente el motivo de su consulta"
                  />
                </div>
              </>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  No se pudo cargar la información del turno.
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading || !profesionalId || !formData.fecha || !formData.hora}
              >
                {loading ? "Guardando..." : "Reprogramar Turno"}
              </Button>
              <Link href="/dashboard/paciente/turnos">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
