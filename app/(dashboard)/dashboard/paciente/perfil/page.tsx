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

export default function PacientePerfilPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    dni: "",
    fechaNacimiento: "",
    direccion: "",
    fotoPerfil: "",
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }
    if (session?.user) fetchPerfil()
  }, [status, session])

  const fetchPerfil = async () => {
    try {
      const response = await fetch("/api/usuario/perfil")
      if (!response.ok) throw new Error("Error al cargar perfil")
      const data = await response.json()
      setFormData({
        nombre: data.nombre || "",
        email: data.email || "",
        telefono: data.telefono || "",
        dni: data.dni || "",
        fechaNacimiento: data.fechaNacimiento || "",
        direccion: data.direccion || "",
        fotoPerfil: data.fotoPerfil || "",
      })
    } catch (err: any) {
      setError(err.message || "Error al cargar datos")
    } finally {
      setLoadingData(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al subir la foto")
      setFormData({ ...formData, fotoPerfil: data.url })
    } catch (err: any) {
      alert(err.message || "Error al subir la foto")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await fetch("/api/usuario/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, fotoPerfil: formData.fotoPerfil || null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Error al actualizar perfil")
      alert("Perfil actualizado correctamente")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Error al actualizar perfil")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] mx-auto" />
          <p className="mt-4 text-[#64748B]">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/paciente">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold text-[#0F172A]">Mi Perfil</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
            <CardDescription>Tu información de cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {formData.fotoPerfil ? (
                <div className="relative">
                  <Image src={formData.fotoPerfil} alt="Foto" width={100} height={100} className="rounded-full object-cover" />
                  <button type="button" onClick={() => setFormData({ ...formData, fotoPerfil: "" })} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-[100px] h-[100px] bg-[#E2E8F0] rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-[#64748B]" />
                </div>
              )}
              <div>
                <input type="file" id="fotoPerfil" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                <Button type="button" variant="outline" disabled={uploadingPhoto} onClick={() => document.getElementById("fotoPerfil")?.click()}>
                  {uploadingPhoto ? "Subiendo..." : "Subir foto"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo *</Label>
                <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <Input id="dni" name="dni" value={formData.dni} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
                <Input id="fechaNacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} />
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar cambios"}</Button>
              <Link href="/dashboard/paciente">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
