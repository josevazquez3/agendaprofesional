import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Settings, Clock } from "lucide-react"

export default async function ProfesionalConfiguracionPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "PROFESIONAL") {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        subtitle="Ajustes y preferencias personales"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Mis Horarios
            </CardTitle>
            <CardDescription>
              Gestionar tus horarios de atención y disponibilidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/profesional/horarios">
              <Button variant="outline" className="w-full">
                Gestionar Horarios
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
