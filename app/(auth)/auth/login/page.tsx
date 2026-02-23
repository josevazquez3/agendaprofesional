"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Credenciales inválidas")
        setLoading(false)
      } else {
        // Usar window.location para asegurar una redirección completa
        window.location.href = "/dashboard"
      }
    } catch (error) {
      setError("Error al iniciar sesión")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
      <Card className="w-full max-w-md min-w-0 bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm">
        <CardHeader className="space-y-1 px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">
            Iniciar Sesión
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            Ingrese sus credenciales para acceder
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-4 sm:px-6 pb-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base sm:text-sm h-11 sm:h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base sm:text-sm h-11 sm:h-10"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 px-4 pb-6 sm:px-6 sm:pb-8 pt-0">
            <Button type="submit" className="w-full h-11 sm:h-10 text-sm sm:text-base" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
            <div className="text-xs sm:text-sm text-center text-muted-foreground">
              ¿No tiene una cuenta?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Regístrese aquí
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
