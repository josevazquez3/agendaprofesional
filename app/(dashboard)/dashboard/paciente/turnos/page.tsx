import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getTurnos } from "@/lib/turno-helpers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { PacienteTurnosList } from "@/components/turnos/paciente-turnos-list"

export default async function PacienteTurnosPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "PACIENTE") {
    redirect("/auth/login")
  }

  const turnos = await getTurnos({
    pacienteId: session.user.id,
    orderBy: { fecha: "desc", hora: "asc" },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Turnos"
        subtitle="Consulta tus turnos y reserva nuevos"
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard/paciente" },
          { label: "Turnos" },
        ]}
        action={
          <Link href="/dashboard/paciente/turnos/nuevo">
            <Button className="rounded-xl">
              <Calendar className="h-4 w-4 mr-2" />
              Nuevo turno
            </Button>
          </Link>
        }
      />

      <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
        <CardHeader className="border-b border-[#E2E8F0]">
          <CardTitle className="text-lg font-semibold text-[#0F172A]">
            Listado de turnos
          </CardTitle>
          <p className="text-sm text-[#64748B] mt-1">
            Total: {turnos.length} turno{turnos.length !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6">
            <PacienteTurnosList
              turnos={turnos}
              basePath="/dashboard/paciente/turnos"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
