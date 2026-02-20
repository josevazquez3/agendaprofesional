"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { Upload, X, ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

export default function ProfesionalPerfilPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    dni: "",
    especialidad: "",
    matricula: "",
    atiendeObraSocial: true,
    fotoPerfil: "",
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [profesionalId, setProfesionalId] = useState<string | null>(null)

  useEffect(() => {
    fetchProfesional()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga al montar y al cambiar sesión
  }, [session])

  const fetchProfesional = async () => {
    try {
      // Primero obtener el ID del profesional
      const meResponse = await fetch("/api/profesional/me")
      if (!meResponse.ok) {
        throw new Error("Error al obtener información del profesional")
      }
      const meData = await meResponse.json()
      setProfesionalId(meData.id)

      // Luego obtener los datos completos
      const response = await fetch(`/api/profesionales/${meData.id}`)
      if (!response.ok) {
        throw new Error("Error al cargar datos del profesional")
      }
      const data = await response.json()
      
      setFormData({
        nombre: data.user.nombre || "",
        email: data.user.email || "",
        telefono: data.user.telefono || "",
        dni: data.user.dni || "",
        especialidad: data.especialidad || "",
        matricula: data.matricula || "",
        atiendeObraSocial: data.atiendeObraSocial !== false,
        fotoPerfil: data.user.fotoPerfil || "",
      })
      setLoadingData(false)
    } catch (error: any) {
      setError(error.message || "Error al cargar datos")
      setLoadingData(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al subir la foto")
      }

      setFormData({
        ...formData,
        fotoPerfil: data.url,
      })
    } catch (error: any) {
      alert(error.message || "Error al subir la foto")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = () => {
    setFormData({
      ...formData,
      fotoPerfil: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!profesionalId) {
      setError("No se pudo identificar el profesional")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/profesional/perfil`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          fotoPerfil: formData.fotoPerfil || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar perfil")
      }

      alert("Perfil actualizado exitosamente")
      router.refresh()
    } catch (error: any) {
      setError(error.message || "Error al actualizar perfil")
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos del perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Perfil"
        subtitle="Edita tu información personal y profesional"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Datos básicos de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo *</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dni">DNI</Label>
              <Input
                id="dni"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Foto de Perfil</Label>
              <div className="flex items-center gap-4">
                {formData.fotoPerfil ? (
                  <div className="relative">
                    <Image
                      src={formData.fotoPerfil}
                      alt="Foto de perfil"
                      width={100}
                      height={100}
                      className="rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    id="fotoPerfil"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <label htmlFor="fotoPerfil">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingPhoto}
                      asChild
                    >
                      <span>
                        {uploadingPhoto ? "Subiendo..." : formData.fotoPerfil ? "Cambiar Foto" : "Subir Foto"}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Profesional */}
        <Card>
          <CardHeader>
            <CardTitle>Información Profesional</CardTitle>
            <CardDescription>
              Datos relacionados con tu práctica profesional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="especialidad">Especialidad *</Label>
              <Input
                id="especialidad"
                name="especialidad"
                value={formData.especialidad}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                name="matricula"
                value={formData.matricula}
                onChange={handleChange}
                placeholder="Número de matrícula profesional"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="atiendeObraSocial"
                name="atiendeObraSocial"
                checked={formData.atiendeObraSocial}
                onChange={handleChange}
                className="rounded"
              />
              <Label htmlFor="atiendeObraSocial" className="cursor-pointer">
                Atiende obra social
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/profesional">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  )
}
