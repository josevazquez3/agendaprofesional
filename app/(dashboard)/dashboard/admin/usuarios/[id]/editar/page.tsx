"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function EditarUsuarioPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    dni: "",
    telefono: "",
    fechaNacimiento: "",
    direccion: "",
    obraSocial: "",
    obraSocialId: "",
    role: "PACIENTE",
  })
  const [obrasSociales, setObrasSociales] = useState<any[]>([])

  useEffect(() => {
    fetchUsuario()
    fetchObrasSociales()
  }, [userId])

  const fetchObrasSociales = async () => {
    try {
      const response = await fetch("/api/obras-sociales/activas")
      if (response.ok) {
        const data = await response.json()
        setObrasSociales(data)
      }
    } catch (error) {
      console.error("Error cargando obras sociales:", error)
    }
  }

  const fetchUsuario = async () => {
    try {
      const response = await fetch(`/api/admin/usuarios/${userId}`)
      if (!response.ok) {
        throw new Error("Error al cargar usuario")
      }
      const data = await response.json()
      
      setFormData({
        nombre: data.nombre || "",
        email: data.email || "",
        password: "",
        confirmPassword: "",
        dni: data.dni || "",
        telefono: data.telefono || "",
        fechaNacimiento: data.fechaNacimiento
          ? new Date(data.fechaNacimiento).toISOString().split("T")[0]
          : "",
        direccion: data.direccion || "",
        obraSocial: data.obraSocial || "",
        obraSocialId: data.obraSocialId || "",
        role: data.role || "PACIENTE",
      })
      setLoadingData(false)
    } catch (error: any) {
      setError(error.message || "Error al cargar usuario")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validar contraseñas si se proporcionan
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden")
        return
      }

      if (formData.password.length > 0 && formData.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres")
        return
      }
    }

    setLoading(true)

    try {
      const updateData: any = {
        nombre: formData.nombre,
        email: formData.email,
        dni: formData.dni || null,
        telefono: formData.telefono || null,
        fechaNacimiento: formData.fechaNacimiento || null,
        direccion: formData.direccion || null,
        obraSocial: formData.obraSocial || null,
        obraSocialId: formData.obraSocialId || null,
        role: formData.role,
      }

      // Solo incluir contraseña si se proporciona
      if (formData.password && formData.password.length > 0) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/admin/usuarios/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar usuario")
      }

      router.push("/dashboard/admin/pacientes")
    } catch (error: any) {
      setError(error.message || "Error al actualizar usuario")
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
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/pacientes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Editar Paciente</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Paciente</CardTitle>
          <CardDescription>
            Modifique los datos del paciente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

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
                <Label htmlFor="password">Nueva Contraseña (dejar vacío para no cambiar)</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  minLength={6}
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
                <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="fechaNacimiento"
                  name="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="obraSocialId">Obra Social</Label>
                <select
                  id="obraSocialId"
                  name="obraSocialId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.obraSocialId}
                  onChange={handleChange}
                >
                  <option value="">Seleccione una obra social</option>
                  {obrasSociales.map((obraSocial) => (
                    <option key={obraSocial.id} value={obraSocial.id}>
                      {obraSocial.nombre} {obraSocial.codigo ? `(${obraSocial.codigo})` : ""}
                    </option>
                  ))}
                </select>
                {obrasSociales.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No hay obras sociales disponibles. Puede ingresar una manualmente.
                  </p>
                )}
                {formData.obraSocialId === "" && (
                  <Input
                    id="obraSocial"
                    name="obraSocial"
                    placeholder="O ingrese el nombre manualmente"
                    value={formData.obraSocial}
                    onChange={handleChange}
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
              <Link href="/dashboard/admin/pacientes">
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
