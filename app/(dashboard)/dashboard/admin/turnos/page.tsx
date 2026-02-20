import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus } from "lucide-react"
import { AppointmentFilters } from "@/components/turnos/appointment-filters"
import { AppointmentTable } from "@/components/turnos/appointment-table"
import { DaySummaryPanel } from "@/components/turnos/day-summary-panel"
import { ExportarTurnosButtons } from "@/components/turnos/ExportarTurnosButtons"

const sinEliminados = { eliminadoAt: null }

export default async function AdminTurnosPage({
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

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const fechaFilter = searchParams.fecha
    ? (() => {
        const fecha = new Date(searchParams.fecha)
        const inicioDia = new Date(fecha)
        inicioDia.setHours(0, 0, 0, 0)
        const finDia = new Date(fecha)
        finDia.setHours(23, 59, 59, 999)
        return { gte: inicioDia, lte: finDia }
      })()
    : undefined

  let turnos: Awaited<ReturnType<typeof prisma.turno.findMany<{
    include: {
      paciente: { select: { id: true; nombre: true; email: true } };
      profesional: { select: { id: true; especialidad: true; user: { select: { id: true; nombre: true; email: true } } } };
    };
  }>>>
  let profesionales: Array<{ id: string; especialidad: string; user: { nombre: string | null } | null }>
  let turnosConfirmados: number
  let turnosPendientes: number
  let turnosCancelados: number
  const fechaFiltro = searchParams.fecha ? new Date(searchParams.fecha) : new Date()
  fechaFiltro.setHours(0, 0, 0, 0)
  const finDia = new Date(fechaFiltro)
  finDia.setHours(23, 59, 59, 999)

  try {
    const [turnosData, profesionalesData, turnosDelDia] = await Promise.all([
      prisma.turno.findMany({
        where: {
          ...sinEliminados,
          ...(searchParams.profesionalId ? { profesionalId: searchParams.profesionalId } : {}),
          ...(searchParams.estado ? { estado: searchParams.estado } : {}),
          ...(fechaFilter ? { fecha: fechaFilter } : {}),
        },
        orderBy: { fecha: "asc" },
        take: 100,
        include: {
          paciente: { select: { id: true, nombre: true, email: true } },
          profesional: {
            select: {
              id: true,
              especialidad: true,
              user: { select: { id: true, nombre: true, email: true } },
            },
          },
        },
      }),
      prisma.profesional.findMany({
        select: { id: true, especialidad: true, user: { select: { nombre: true } } },
      }),
      prisma.turno.findMany({
        where: {
          fecha: { gte: fechaFiltro, lte: finDia },
          ...sinEliminados,
        },
        select: { estado: true },
      }),
    ])
    turnos = turnosData
    profesionales = profesionalesData
    turnosConfirmados = turnosDelDia.filter((t) => t.estado === "CONFIRMADO").length
    turnosPendientes = turnosDelDia.filter((t) => t.estado === "PENDIENTE").length
    turnosCancelados = turnosDelDia.filter((t) => t.estado === "CANCELADO").length
  } catch (err) {
    console.error("[Admin turnos] Error cargando datos:", err)
    turnos = []
    profesionales = []
    turnosConfirmados = 0
    turnosPendientes = 0
    turnosCancelados = 0
  }

  // Serializar fechas a ISO para evitar error de serialización Server→Client (Date no es serializable)
  let turnosFiltrados = turnos.map((t) => ({
    id: t.id,
    pacienteId: t.pacienteId,
    profesionalId: t.profesionalId,
    fecha: t.fecha instanceof Date ? t.fecha.toISOString() : String(t.fecha),
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

  if (searchParams.search) {
    const searchLower = searchParams.search.toLowerCase()
    turnosFiltrados = turnosFiltrados.filter(
      (t) =>
        t.paciente?.nombre?.toLowerCase().includes(searchLower) ||
        t.paciente?.email?.toLowerCase().includes(searchLower)
    )
  }

  if (searchParams.especialidad) {
    turnosFiltrados = turnosFiltrados.filter(
      (t) => t.profesional?.especialidad === searchParams.especialidad
    )
  }

  const profesionalesParaFiltro = profesionales.map((p) => ({
    id: p.id,
    especialidad: p.especialidad,
    user: { nombre: p.user?.nombre ?? "" },
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-[#0F172A] font-inter">
            Gestión de Turnos
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Administre y organice los turnos de pacientes
          </p>
        </div>
        <Link href="/dashboard/admin/turnos/nuevo">
          <Button className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium px-6 transition-all duration-200 ease-out hover:scale-[1.02]">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo turno
          </Button>
        </Link>
      </div>

      <AppointmentFilters profesionales={profesionalesParaFiltro} />

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <div className="min-w-0">
          <Card className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm">
            <CardHeader className="border-b border-[#E2E8F0]">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-medium text-[#0F172A] font-inter">
                    Listado de Turnos
                  </CardTitle>
                  <p className="text-sm text-[#64748B] mt-1">
                    Total: {turnosFiltrados.length} turno{turnosFiltrados.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {turnosFiltrados.length > 0 && (
                  <ExportarTurnosButtons turnos={turnosFiltrados as any} />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6">
                <AppointmentTable
                  turnos={turnosFiltrados as any}
                  basePath="/dashboard/admin/turnos"
                  showEliminar
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="shrink-0">
          <DaySummaryPanel
            turnosConfirmados={turnosConfirmados}
            turnosPendientes={turnosPendientes}
            turnosCancelados={turnosCancelados}
            fecha={fechaFiltro.toISOString()}
          />
        </div>
      </div>
    </div>
  )
}
