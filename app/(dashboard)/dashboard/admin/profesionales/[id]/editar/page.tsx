"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { Upload, X, User, MapPin, Plus } from "lucide-react"

type ConsultorioAsignado = {
  id: string
  consultorioId: string
  consultorio: { id: string; nombre: string; direccion: string }
}
type ConsultorioOption = { id: string; nombre: string; direccion: string; clinicId: string }

export default function EditarProfesionalPage() {
  const router = useRouter()
  const params = useParams()
  const profesionalId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [consultoriosAsignados, setConsultoriosAsignados] = useState<ConsultorioAsignado[]>([])
  const [listConsultorios, setListConsultorios] = useState<ConsultorioOption[]>([])
  const [consultorioSelect, setConsultorioSelect] = useState("")
  const [loadingConsultorio, setLoadingConsultorio] = useState(false)
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

  const fetchConsultorios = async () => {
    try {
      const res = await fetch("/api/consultorios")
      if (res.ok) {
        const list = await res.json()
        setListConsultorios(
          Array.isArray(list)
            ? list.map((c: any) => ({
                id: c.id,
                nombre: c.nombre,
                direccion: c.direccion || "",
                clinicId: c.clinicId || "",
              }))
            : []
        )
      }
    } catch {
      setListConsultorios([])
    }
  }

  const fetchProfesional = async () => {
    try {
      const [response, _] = await Promise.all([
        fetch(`/api/profesionales/${profesionalId}`),
        fetchConsultorios(),
      ])
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const serverError = (data as { error?: string }).error
        const msg =
          serverError ||
          (response.status === 500
            ? "Error del servidor (500). Revisa la consola del servidor (terminal donde corre npm run dev) para ver el detalle."
            : "Error al cargar profesional")
        throw new Error(msg)
      }

      const user = data.user ?? {}
      setError("")
      setClinicId(data.clinicId ?? null)
      setConsultoriosAsignados(Array.isArray(data.consultoriosAsignados) ? data.consultoriosAsignados : [])

      const arancelActivo = data.aranceles?.find((a: any) => a.activo) || null
      setFormData({
        nombre: user.nombre || "",
        email: user.email || "",
        telefono: user.telefono || "",
        dni: user.dni || "",
        especialidad: data.especialidad || "",
        matricula: data.matricula || "",
        atiendeObraSocial: data.atiendeObraSocial !== false,
        obraSocial: user.obraSocial || "",
        tieneArancel: !!arancelActivo,
        arancelMonto: arancelActivo?.monto?.toString() || "",
        arancelDescripcion: arancelActivo?.descripcion || "",
        fotoPerfil: user.fotoPerfil || "",
      })
      setLoadingData(false)
    } catch (error: any) {
      setError(error?.message || "Error al cargar profesional")
      setLoadingData(false)
    }
  }

  const consultoriosDisponibles = listConsultorios.filter(
    (c) =>
      (!clinicId || c.clinicId === clinicId) &&
      !consultoriosAsignados.some((a) => a.consultorio.id === c.id)
  )

  const handleAsignarConsultorio = async () => {
    if (!consultorioSelect) return
    setLoadingConsultorio(true)
    setError("")
    try {
      const res = await fetch("/api/consultorios/asociar-profesional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultorioId: consultorioSelect,
          profesionalId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al asignar")
      const con = listConsultorios.find((c) => c.id === consultorioSelect)
      if (con) {
        setConsultoriosAsignados((prev) => [
          ...prev,
          {
            id: "",
            consultorioId: con.id,
            consultorio: { id: con.id, nombre: con.nombre, direccion: con.direccion },
          },
        ])
        setConsultorioSelect("")
      }
    } catch (e: any) {
      setError(e.message || "Error al asignar consultorio")
    } finally {
      setLoadingConsultorio(false)
    }
  }

  const handleDesasignarConsultorio = async (consultorioId: string) => {
    setLoadingConsultorio(true)
    setError("")
    try {
      const res = await fetch("/api/consultorios/desasociar-profesional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultorioId, profesionalId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al quitar")
      setConsultoriosAsignados((prev) => prev.filter((a) => a.consultorio.id !== consultorioId))
    } catch (e: any) {
      setError(e.message || "Error al quitar consultorio")
    } finally {
      setLoadingConsultorio(false)
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

              <div className="space-y-2 md:col-span-2 border-t pt-6">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Consultorios asignados
                </Label>
                <p className="text-sm text-gray-500">
                  Asigna los consultorios donde atiende este profesional. Podrás elegir el consultorio al crear cada turno.
                </p>
                {consultoriosAsignados.length > 0 && (
                  <ul className="space-y-2 mt-2">
                    {consultoriosAsignados.map((a) => (
                      <li
                        key={a.consultorio.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      >
                        <div>
                          <span className="font-medium">{a.consultorio.nombre}</span>
                          {a.consultorio.direccion && (
                            <p className="text-sm text-gray-500">{a.consultorio.direccion}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={loadingConsultorio}
                          onClick={() => handleDesasignarConsultorio(a.consultorio.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Quitar
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap items-end gap-2 mt-3">
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="consultorioSelect" className="sr-only">
                      Agregar consultorio
                    </Label>
                    <select
                      id="consultorioSelect"
                      value={consultorioSelect}
                      onChange={(e) => setConsultorioSelect(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loadingConsultorio}
                    >
                      <option value="">Seleccionar consultorio...</option>
                      {consultoriosDisponibles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                          {c.direccion ? ` — ${c.direccion}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    disabled={!consultorioSelect || loadingConsultorio}
                    onClick={handleAsignarConsultorio}
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Asignar consultorio
                  </Button>
                </div>
                {consultoriosDisponibles.length === 0 && listConsultorios.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Todos los consultorios de la clínica ya están asignados a este profesional.
                  </p>
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
