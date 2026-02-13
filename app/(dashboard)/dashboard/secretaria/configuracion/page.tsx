import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Settings, Clock, Building2, Heart } from "lucide-react"

export default async function SecretariaConfiguracionPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== "SECRETARIA" && session.user.role !== "ADMIN")) {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        subtitle="Ajustes y preferencias del sistema"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios
            </CardTitle>
            <CardDescription>
              Gestionar horarios de atención de profesionales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/secretaria/horarios">
              <Button variant="outline" className="w-full">
                Ver Horarios
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Consultorios
            </CardTitle>
            <CardDescription>
              Gestionar consultorios y sus asignaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/secretaria/consultorios">
              <Button variant="outline" className="w-full">
                Ver Consultorios
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Obras Sociales
            </CardTitle>
            <CardDescription>
              Gestionar obras sociales y convenios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/secretaria/obras-sociales">
              <Button variant="outline" className="w-full">
                Ver Obras Sociales
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración General
            </CardTitle>
            <CardDescription>
              Para cambios avanzados, contacte al administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              La configuración avanzada del sistema solo está disponible para administradores.
              Si necesita realizar cambios en la configuración general, por favor contacte al administrador del sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
