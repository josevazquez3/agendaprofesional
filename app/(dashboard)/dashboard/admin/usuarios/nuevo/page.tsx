"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [obrasSociales, setObrasSociales] = useState<any[]>([])
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
    especialidad: "",
    matricula: "",
    atiendeObraSocial: true,
  })

  useEffect(() => {
    fetchObrasSociales()
  }, [])

  const fetchObrasSociales = async () => {
    try {
      const response = await fetch("/api/obras-sociales/activas")
      if (response.ok) {
        const data = await response.json()
        setObrasSociales(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error cargando obras sociales:", error)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/admin/usuarios/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          obraSocialId: formData.obraSocialId === "SIN_OBRA_SOCIAL" ? "" : formData.obraSocialId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Mostrar el mensaje de error específico del servidor
        const errorMessage = data.error || "Error al crear usuario"
        const errorDetails = data.details ? `\n\nDetalles: ${data.details}` : ""
        throw new Error(errorMessage + errorDetails)
      }

      router.push("/dashboard/admin/usuarios")
    } catch (error: any) {
      console.error("Error completo:", error)
      // Mostrar mensaje de error más descriptivo
      const errorMessage = error.message || "Error al crear usuario. Por favor, verifica los datos e intenta nuevamente."
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Crear Nuevo Usuario</h1>
        <Link href="/dashboard/admin/usuarios">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Usuario</CardTitle>
          <CardDescription>Complete los datos para crear un nuevo usuario</CardDescription>
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
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol *</Label>
                <select
                  id="role"
                  name="role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="PACIENTE">Paciente</option>
                  <option value="PROFESIONAL">Profesional</option>
                  <option value="SECRETARIA">Secretaria</option>
                  <option value="ADMIN">Admin</option>
                </select>
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
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "SIN_OBRA_SOCIAL") {
                      setFormData({ ...formData, obraSocialId: "SIN_OBRA_SOCIAL", obraSocial: "No tengo obra social" })
                      return
                    }
                    const selectedObraSocial = obrasSociales.find(os => os.id === val)
                    setFormData({
                      ...formData,
                      obraSocialId: val,
                      obraSocial: selectedObraSocial ? selectedObraSocial.nombre : "",
                    })
                  }}
                >
                  <option value="">Seleccione una obra social</option>
                  <option value="SIN_OBRA_SOCIAL">No tengo obra social</option>
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
                {formData.obraSocialId !== "SIN_OBRA_SOCIAL" && formData.obraSocialId === "" && (
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

            {formData.role === "PROFESIONAL" && (
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold">Datos del Profesional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="especialidad">Especialidad *</Label>
                    <Input
                      id="especialidad"
                      name="especialidad"
                      value={formData.especialidad}
                      onChange={handleChange}
                      required={formData.role === "PROFESIONAL"}
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

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="atiendeObraSocial"
                        checked={formData.atiendeObraSocial}
                        onChange={handleChange}
                        className="rounded"
                      />
                      <span>Atiende Obra Social</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear Usuario"}
              </Button>
              <Link href="/dashboard/admin/usuarios">
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
