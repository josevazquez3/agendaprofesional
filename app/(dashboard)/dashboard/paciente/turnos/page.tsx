import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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

  const turnosRaw = await prisma.turno.findMany({
    where: { pacienteId: session.user.id, eliminadoAt: null },
    orderBy: [{ fecha: "desc" }, { hora: "asc" }],
    include: {
      paciente: { select: { nombre: true, email: true } },
      profesional: {
        select: {
          id: true,
          especialidad: true,
          user: { select: { nombre: true, email: true } },
        },
      },
    },
  })

  const turnos = turnosRaw.map((t) => ({
    id: t.id,
    pacienteId: t.pacienteId,
    profesionalId: t.profesionalId,
    fecha: t.fecha,
    hora: t.hora,
    estado: t.estado,
    motivo: t.motivo,
    codigoTurno: t.codigoTurno,
    paciente: t.paciente ? { nombre: t.paciente.nombre, email: t.paciente.email } : undefined,
    profesional: t.profesional
      ? {
          id: t.profesional.id,
          especialidad: t.profesional.especialidad,
          user: t.profesional.user
            ? { nombre: t.profesional.user.nombre, email: t.profesional.user.email }
            : undefined,
        }
      : undefined,
  }))

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

      <Card className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm">
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
