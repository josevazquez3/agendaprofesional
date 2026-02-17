"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, Plus, X } from "lucide-react"

export default function ConsultorioProfesionalesPage() {
  const router = useRouter()
  const params = useParams()
  const consultorioId = params.id as string

  const [consultorio, setConsultorio] = useState<any>(null)
  const [profesionales, setProfesionales] = useState<any[]>([])
  const [profesionalesAsociados, setProfesionalesAsociados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [consultorioId])

  const fetchData = async () => {
    try {
      // Obtener consultorio y profesionales asociados
      const consultorioRes = await fetch(`/api/consultorios/${consultorioId}`)
      const consultorioData = await consultorioRes.json()
      setConsultorio(consultorioData)
      setProfesionalesAsociados(consultorioData.profesionales || [])

      // Obtener todos los profesionales
      const profesionalesRes = await fetch("/api/profesionales")
      const profesionalesData = await profesionalesRes.json()
      setProfesionales(Array.isArray(profesionalesData) ? profesionalesData : [])
    } catch (error) {
      console.error("Error cargando datos:", error)
    }
  }

  const handleAsociar = async (profesionalId: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/consultorios/asociar-profesional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultorioId,
          profesionalId,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al asociar profesional")
      }

      await fetchData()
    } catch (error) {
      alert("Error al asociar profesional")
    } finally {
      setLoading(false)
    }
  }

  const handleDesasociar = async (profesionalId: string) => {
    if (!confirm("¿Estás seguro de desasociar este profesional?")) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/consultorios/desasociar-profesional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultorioId,
          profesionalId,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al desasociar profesional")
      }

      await fetchData()
    } catch (error) {
      alert("Error al desasociar profesional")
    } finally {
      setLoading(false)
    }
  }

  const profesionalesDisponibles = profesionales.filter(
    (prof) =>
      !profesionalesAsociados.some(
        (ap) => ap.profesional.id === prof.id
      )
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Profesionales - {consultorio?.nombre}
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona los profesionales asociados a este consultorio
          </p>
        </div>
        <Link href="/dashboard/secretaria/consultorios">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profesionales Asociados</CardTitle>
            <CardDescription>
              {profesionalesAsociados.length} profesional(es) asociado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profesionalesAsociados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay profesionales asociados
              </div>
            ) : (
              <div className="space-y-2">
                {profesionalesAsociados.map((cp) => (
                  <div
                    key={cp.id}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{cp.profesional.user.nombre}</p>
                      <p className="text-sm text-gray-600">
                        {cp.profesional.especialidad}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDesasociar(cp.profesional.id)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agregar Profesional</CardTitle>
            <CardDescription>
              Selecciona un profesional para asociar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profesionalesDisponibles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Todos los profesionales están asociados
              </div>
            ) : (
              <div className="space-y-2">
                {profesionalesDisponibles.map((prof) => (
                  <div
                    key={prof.id}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{prof.user.nombre}</p>
                      <p className="text-sm text-gray-600">{prof.especialidad}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAsociar(prof.id)}
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
