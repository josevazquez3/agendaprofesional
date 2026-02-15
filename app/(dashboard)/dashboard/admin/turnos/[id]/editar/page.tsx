"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { format } from "date-fns"
import { AlertTriangle } from "lucide-react"

export default function EditarTurnoAdminPage() {
  const router = useRouter()
  const params = useParams()
  const turnoId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    fecha: "",
    hora: "",
    estado: "PENDIENTE",
    motivo: "",
    obraSocial: "",
  })
  const [eliminacion, setEliminacion] = useState<{
    motivoEliminacion?: string | null
    eliminadoAt?: string | null
    eliminadoPor?: { nombre: string }
  } | null>(null)

  useEffect(() => {
    fetchTurno()
  }, [turnoId])

  const fetchTurno = async () => {
    try {
      const response = await fetch(`/api/turnos/${turnoId}`)
      if (!response.ok) {
        throw new Error("Error al cargar turno")
      }
      const data = await response.json()
      
      setFormData({
        fecha: data.fecha ? new Date(data.fecha).toISOString().split("T")[0] : "",
        hora: data.hora || "",
        estado: data.estado || "PENDIENTE",
        motivo: data.motivo || "",
        obraSocial: data.obraSocial || "",
      })
      if (data.estado === "ELIMINADO") {
        setEliminacion({
          motivoEliminacion: data.motivoEliminacion ?? null,
          eliminadoAt: data.eliminadoAt ?? null,
          eliminadoPor: data.eliminadoPor,
        })
      } else {
        setEliminacion(null)
      }
      setLoadingData(false)
    } catch (error: any) {
      setError(error.message || "Error al cargar turno")
      setLoadingData(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`/api/turnos/${turnoId}/editar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar turno")
      }

      router.push("/dashboard/admin/turnos")
    } catch (error: any) {
      setError(error.message || "Error al actualizar turno")
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
        <h1 className="text-3xl font-bold">Editar Turno</h1>
        <Link href="/dashboard/admin/turnos">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Turno</CardTitle>
          <CardDescription>
            Modifica los datos del turno
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formData.estado === "ELIMINADO" && eliminacion && (
            <div className="mb-4 p-3 rounded-md border border-red-200 bg-red-50 text-red-800">
              <p className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Turno Eliminado
              </p>
              {eliminacion.motivoEliminacion && (
                <p className="text-sm mt-1"><strong>Causa de eliminación:</strong> {eliminacion.motivoEliminacion}</p>
              )}
              {eliminacion.eliminadoAt && (
                <p className="text-sm mt-0.5"><strong>Fecha de eliminación:</strong> {format(new Date(eliminacion.eliminadoAt), "dd/MM/yyyy HH:mm")}</p>
              )}
              {eliminacion.eliminadoPor?.nombre && (
                <p className="text-sm mt-0.5"><strong>Eliminado por:</strong> {eliminacion.eliminadoPor.nombre}</p>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  name="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hora">Hora *</Label>
                <Input
                  id="hora"
                  name="hora"
                  type="time"
                  value={formData.hora}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <select
                  id="estado"
                  name="estado"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.estado}
                  onChange={handleChange}
                  required
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="CONFIRMADO">Confirmado</option>
                  <option value="CANCELADO">Cancelado</option>
                  <option value="COMPLETADO">Completado</option>
                  <option value="ELIMINADO">Eliminado (no disponible)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="obraSocial">Obra Social</Label>
                <Input
                  id="obraSocial"
                  name="obraSocial"
                  value={formData.obraSocial}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de la consulta</Label>
              <textarea
                id="motivo"
                name="motivo"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.motivo}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
              <Link href={`/dashboard/paciente/turnos/${turnoId}/imprimir`}>
                <Button type="button" variant="outline">
                  Imprimir con QR
                </Button>
              </Link>
              <Link href="/dashboard/admin/turnos">
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
