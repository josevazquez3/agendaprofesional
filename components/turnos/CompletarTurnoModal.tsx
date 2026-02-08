"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface CompletarTurnoModalProps {
  turnoId: string
  pacienteNombre: string
  onClose: () => void
  onSuccess: () => void
}

export function CompletarTurnoModal({
  turnoId,
  pacienteNombre,
  onClose,
  onSuccess,
}: CompletarTurnoModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    notas: "",
    diagnostico: "",
    tratamiento: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/turnos/completar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnoId,
          ...formData,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al completar turno")
      }

      const data = await response.json()
      console.log("Turno completado exitosamente:", data)

      onSuccess()
      onClose()
    } catch (error: any) {
      alert(error.message || "Error al completar turno")
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Completar Turno</CardTitle>
              <CardDescription>Paciente: {pacienteNombre}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="notas">Observaciones</Label>
              <textarea
                id="notas"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                value={formData.notas}
                onChange={(e) =>
                  setFormData({ ...formData, notas: e.target.value })
                }
                placeholder="Observaciones de la consulta..."
              />
            </div>

            <div>
              <Label htmlFor="diagnostico">Diagnóstico</Label>
              <textarea
                id="diagnostico"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                value={formData.diagnostico}
                onChange={(e) =>
                  setFormData({ ...formData, diagnostico: e.target.value })
                }
                placeholder="Diagnóstico..."
              />
            </div>

            <div>
              <Label htmlFor="tratamiento">Tratamiento</Label>
              <textarea
                id="tratamiento"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                value={formData.tratamiento}
                onChange={(e) =>
                  setFormData({ ...formData, tratamiento: e.target.value })
                }
                placeholder="Tratamiento indicado..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Guardando..." : "Guardar y Completar"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
