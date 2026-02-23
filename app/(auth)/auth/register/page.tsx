"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterPage() {
  const router = useRouter()
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
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          dni: formData.dni || null,
          telefono: formData.telefono || null,
          fechaNacimiento: formData.fechaNacimiento || null,
          direccion: formData.direccion || null,
          obraSocial: formData.obraSocial || null,
          role: "PACIENTE",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar")
      }

      router.push("/auth/login?registered=true")
    } catch (error: any) {
      setError(error.message || "Error al registrar usuario")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 overflow-y-auto">
      <Card className="w-full max-w-2xl min-w-0 my-auto bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm">
        <CardHeader className="space-y-1 px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">
            Registro de Paciente
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            Complete sus datos para crear una cuenta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-4 sm:px-6 pb-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm sm:text-base">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="text-base sm:text-sm h-11 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dni" className="text-sm sm:text-base">DNI</Label>
                <Input
                  id="dni"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  className="text-base sm:text-sm h-11 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="text-base sm:text-sm h-11 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-sm sm:text-base">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="text-base sm:text-sm h-11 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento" className="text-sm sm:text-base">Fecha de Nacimiento</Label>
                <Input
                  id="fechaNacimiento"
                  name="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  className="text-base sm:text-sm h-11 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="obraSocial" className="text-sm sm:text-base">Obra Social</Label>
                <Input
                  id="obraSocial"
                  name="obraSocial"
                  value={formData.obraSocial}
                  onChange={handleChange}
                  className="text-base sm:text-sm h-11 sm:h-10"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="direccion" className="text-sm sm:text-base">Dirección</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="text-base sm:text-sm h-11 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base">Contraseña *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="text-base sm:text-sm h-11 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="text-base sm:text-sm h-11 sm:h-10"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 px-4 pb-6 sm:px-6 sm:pb-8 pt-0">
            <Button type="submit" className="w-full h-11 sm:h-10 text-sm sm:text-base" disabled={loading}>
              {loading ? "Registrando..." : "Registrarse"}
            </Button>
            <div className="text-xs sm:text-sm text-center text-muted-foreground">
              ¿Ya tiene una cuenta?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Inicie sesión aquí
              </Link>
            </div>
            <Link href="/" className="text-xs sm:text-sm text-primary hover:underline">
              Volver al inicio
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
