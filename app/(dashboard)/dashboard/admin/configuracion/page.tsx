import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { PageHeader } from "@/components/ui/page-header"
import { ConfiguracionForm } from "@/components/configuracion/configuracion-form"

export default async function AdminConfiguracionPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración del Sistema"
        subtitle="Ajustes generales de la aplicación"
      />

      <ConfiguracionForm />
    </div>
  )
}
