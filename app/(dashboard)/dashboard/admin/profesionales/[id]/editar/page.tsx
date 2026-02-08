"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { Upload, X, User } from "lucide-react"

export default function EditarProfesionalPage() {
  const router = useRouter()
  const params = useParams()
  const profesionalId = params.id as string

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
    obraSocial: "",
    tieneArancel: false,
    arancelMonto: "",
    arancelDescripcion: "",
    fotoPerfil: "",
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    fetchProfesional()
  }, [profesionalId])

  const fetchProfesional = async () => {
    try {
      const response = await fetch(`/api/profesionales/${profesionalId}`)
      if (!response.ok) {
        throw new Error("Error al cargar profesional")
      }
      const data = await response.json()
      
      // Obtener arancel activo si existe
      const arancelActivo = data.aranceles?.find((a: any) => a.activo) || null
      
      setFormData({
        nombre: data.user.nombre || "",
        email: data.user.email || "",
        telefono: data.user.telefono || "",
        dni: data.user.dni || "",
        especialidad: data.especialidad || "",
        matricula: data.matricula || "",
        atiendeObraSocial: data.atiendeObraSocial !== false,
        obraSocial: data.user.obraSocial || "",
        tieneArancel: !!arancelActivo,
        arancelMonto: arancelActivo?.monto?.toString() || "",
        arancelDescripcion: arancelActivo?.descripcion || "",
        fotoPerfil: data.user.fotoPerfil || "",
      })
      setLoadingData(false)
    } catch (error: any) {
      setError(error.message || "Error al cargar profesional")
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

    try {
      const response = await fetch(`/api/profesionales/${profesionalId}/editar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          arancelMonto: formData.tieneArancel && formData.arancelMonto 
            ? parseFloat(formData.arancelMonto) 
            : null,
          fotoPerfil: formData.fotoPerfil || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar profesional")
      }

      router.push("/dashboard/admin/profesionales")
    } catch (error: any) {
      setError(error.message || "Error al actualizar profesional")
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Editar Profesional</h1>
        <Link href="/dashboard/admin/profesionales">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Profesional</CardTitle>
          <CardDescription>
            Modifica los datos del profesional médico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <Label>Foto de Perfil</Label>
              <div className="flex items-center gap-4">
                {formData.fotoPerfil ? (
                  <div className="relative">
                    <Image
                      src={formData.fotoPerfil}
                      alt="Foto de perfil"
                      width={120}
                      height={120}
                      className="rounded-full object-cover border-2 border-gray-300"
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
                  <div className="w-30 h-30 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    id="fotoPerfil"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  <label htmlFor="fotoPerfil">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingPhoto}
                      className="cursor-pointer"
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingPhoto ? "Subiendo..." : formData.fotoPerfil ? "Cambiar Foto" : "Subir Foto"}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Formatos permitidos: JPG, PNG, WEBP (máx. 5MB)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
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
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    name="atiendeObraSocial"
                    checked={formData.atiendeObraSocial}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span>Atiende Obra Social</span>
                </label>
                
                {formData.atiendeObraSocial && (
                  <div className="ml-6 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="obraSocial">
                        Obra Social *
                      </Label>
                      <Input
                        id="obraSocial"
                        name="obraSocial"
                        value={formData.obraSocial}
                        onChange={handleChange}
                        placeholder="Ej: OSDE, Swiss Medical, etc."
                        required={formData.atiendeObraSocial}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    name="tieneArancel"
                    checked={formData.tieneArancel}
                    onChange={handleChange}
                    className="rounded"
                  />
                  <span>Atiende con Arancel</span>
                </label>
                
                {formData.tieneArancel && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="arancelMonto">
                        Precio del Arancel ($) *
                      </Label>
                      <Input
                        id="arancelMonto"
                        name="arancelMonto"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.arancelMonto}
                        onChange={handleChange}
                        placeholder="0.00"
                        required={formData.tieneArancel}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="arancelDescripcion">
                        Descripción del Arancel
                      </Label>
                      <Input
                        id="arancelDescripcion"
                        name="arancelDescripcion"
                        value={formData.arancelDescripcion}
                        onChange={handleChange}
                        placeholder="Ej: Consulta general"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
              <Link href="/dashboard/admin/profesionales">
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
