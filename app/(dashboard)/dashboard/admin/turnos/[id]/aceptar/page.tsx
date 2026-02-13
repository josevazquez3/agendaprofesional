"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Upload, X, FileText } from "lucide-react"

interface ArchivoAdjunto {
  nombreArchivo: string
  urlArchivo: string
  tipoArchivo: string
  tamano: number
}

export default function AceptarTurnoAdminPage() {
  const router = useRouter()
  const params = useParams()
  const turnoId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    fecha: "",
    hora: "",
    estado: "CONFIRMADO",
    motivo: "",
    obraSocial: "",
  })
  const [archivosAdjuntos, setArchivosAdjuntos] = useState<ArchivoAdjunto[]>([])

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
      setLoadingData(false)
    } catch (error: any) {
      setError(error.message || "Error al cargar turno")
      setLoadingData(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo (solo PDF y DOCX)
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    const allowedExtensions = [".pdf", ".docx"]
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      alert("Solo se permiten archivos PDF y DOCX")
      return
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert("El archivo es demasiado grande. Máximo 10MB")
      return
    }

    setUploadingFile(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const response = await fetch("/api/upload/estudios", {
        method: "POST",
        body: uploadFormData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al subir archivo")
      }

      // Agregar archivo a la lista de adjuntos
      setArchivosAdjuntos([
        ...archivosAdjuntos,
        {
          nombreArchivo: data.nombreArchivo,
          urlArchivo: data.url,
          tipoArchivo: data.tipoArchivo,
          tamano: data.tamano,
        },
      ])

      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      alert(error.message || "Error al subir archivo")
    } finally {
      setUploadingFile(false)
    }
  }

  const eliminarArchivo = (index: number) => {
    setArchivosAdjuntos(archivosAdjuntos.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`/api/turnos/${turnoId}/aceptar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motivo: formData.motivo,
          archivos: archivosAdjuntos,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al aceptar turno")
      }

      router.push("/dashboard/admin/turnos")
    } catch (error: any) {
      setError(error.message || "Error al aceptar turno")
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
        <h1 className="text-3xl font-bold">Aceptar Turno</h1>
        <Link href="/dashboard/admin/turnos">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Turno</CardTitle>
          <CardDescription>
            Completa los datos del turno para guardarlo en historia clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  disabled
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
                  disabled
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
                  disabled
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="CONFIRMADO">Confirmado</option>
                  <option value="CANCELADO">Cancelado</option>
                  <option value="COMPLETADO">Completado</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="obraSocial">Obra Social</Label>
                <Input
                  id="obraSocial"
                  name="obraSocial"
                  value={formData.obraSocial}
                  onChange={handleChange}
                  disabled
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
                placeholder="Escribe el motivo de la consulta..."
              />
            </div>

            {/* Lista de archivos adjuntos */}
            {archivosAdjuntos.length > 0 && (
              <div className="space-y-2">
                <Label>Archivos adjuntos</Label>
                <div className="space-y-2">
                  {archivosAdjuntos.map((archivo, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded-md bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{archivo.nombreArchivo}</span>
                        <span className="text-xs text-gray-500">
                          ({archivo.tipoArchivo})
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarArchivo(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-between items-center">
              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Link href="/dashboard/admin/turnos">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="adjuntar-estudios"
                  disabled={uploadingFile}
                />
                <label htmlFor="adjuntar-estudios">
                  <Button
                    type="button"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={uploadingFile}
                    asChild
                  >
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingFile ? "Subiendo..." : "Adjuntar estudios"}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
