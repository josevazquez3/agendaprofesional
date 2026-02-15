import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { getProfesionales } from "@/lib/profesional-helpers"
import { getTurnos, countTurnos } from "@/lib/turno-helpers"
import Link from "next/link"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { AppointmentFilters } from "@/components/turnos/appointment-filters"
import { AppointmentTable } from "@/components/turnos/appointment-table"
import { DaySummaryPanel } from "@/components/turnos/day-summary-panel"
import { ExportarTurnosButtons } from "@/components/turnos/ExportarTurnosButtons"

export default async function SecretariaTurnosPage({
  searchParams,
}: {
  searchParams: {
    profesionalId?: string
    estado?: string
    fecha?: string
    search?: string
    especialidad?: string
  }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== "SECRETARIA" && session.user.role !== "ADMIN")) {
    redirect("/auth/login")
  }

  const where: any = {}

  if (searchParams.profesionalId) {
    where.profesionalId = searchParams.profesionalId
  }

  if (searchParams.estado) {
    where.estado = searchParams.estado
  }

  if (searchParams.fecha) {
    const fecha = new Date(searchParams.fecha)
    const inicioDia = new Date(fecha.setHours(0, 0, 0, 0))
    const finDia = new Date(fecha.setHours(23, 59, 59, 999))
    where.fecha = {
      gte: inicioDia,
      lte: finDia,
    }
  }

  if (searchParams.search) {
    where.paciente = {
      nombre: {
        contains: searchParams.search,
        mode: "insensitive",
      },
    }
  }

  if (searchParams.especialidad) {
    where.profesional = {
      especialidad: searchParams.especialidad,
    }
  }

  // Construir filtros para getTurnos
  const turnosFilters: any = {
    orderBy: { fecha: "asc" },
    take: 100,
  }

  if (searchParams.profesionalId) {
    turnosFilters.profesionalId = searchParams.profesionalId
  }

  if (searchParams.estado) {
    turnosFilters.estado = searchParams.estado
  }

  if (searchParams.fecha) {
    const fecha = new Date(searchParams.fecha)
    const inicioDia = new Date(fecha)
    inicioDia.setHours(0, 0, 0, 0)
    const finDia = new Date(fecha)
    finDia.setHours(23, 59, 59, 999)
    turnosFilters.fecha = {
      gte: inicioDia,
      lte: finDia,
    }
  }

  const turnos = await getTurnos(turnosFilters)

  const profesionalesRaw = await getProfesionales({
    includeUser: true,
    includeUserFields: ["nombre"],
  })
  
  const profesionales = profesionalesRaw
    .filter((p) => p.user)
    .map((p) => ({
      id: p.id,
      user: { nombre: p.user!.nombre },
      especialidad: p.especialidad,
    }))

  // Calcular resumen del día
  const fechaFiltro = searchParams.fecha
    ? new Date(searchParams.fecha)
    : new Date()
  fechaFiltro.setHours(0, 0, 0, 0)
  const finDia = new Date(fechaFiltro)
  finDia.setHours(23, 59, 59, 999)

  const turnosDelDia = await getTurnos({
    fecha: {
      gte: fechaFiltro,
      lte: finDia,
    },
  })

  const turnosConfirmados = turnosDelDia.filter(
    (t) => t.estado === "CONFIRMADO"
  ).length
  const turnosPendientes = turnosDelDia.filter(
    (t) => t.estado === "PENDIENTE"
  ).length
  const turnosCancelados = turnosDelDia.filter(
    (t) => t.estado === "CANCELADO"
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Gestión de Turnos"
        subtitle="Administre y organice los turnos de pacientes"
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard/secretaria" },
          { label: "Turnos" },
        ]}
        action={
          <Link href="/dashboard/secretaria/turnos/nuevo">
            <Button className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium px-6 transition-all duration-200 ease-out hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo turno
            </Button>
          </Link>
        }
      />

      {/* Barra de herramientas */}
      <AppointmentFilters profesionales={profesionales} />

      {/* Contenido principal */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tabla de turnos */}
        <div className="lg:col-span-2">
          <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
            <CardHeader className="border-b border-[#E2E8F0]">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold text-[#0F172A] font-inter">
                    Listado de Turnos
                  </CardTitle>
                  <p className="text-sm text-[#64748B] mt-1">
                    Total: {turnos.length} turno{turnos.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {turnos.length > 0 && (
                  <ExportarTurnosButtons turnos={turnos as any} />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6">
                <AppointmentTable
                  turnos={turnos as any}
                  basePath="/dashboard/secretaria/turnos"
                  showEliminar
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral - Resumen del día */}
        <div className="lg:col-span-1">
          <DaySummaryPanel
            turnosConfirmados={turnosConfirmados}
            turnosPendientes={turnosPendientes}
            turnosCancelados={turnosCancelados}
            fecha={fechaFiltro}
          />
        </div>
      </div>
    </div>
  )
}
