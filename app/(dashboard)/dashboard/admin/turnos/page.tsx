import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { getTurnos } from "@/lib/turno-helpers"
import Link from "next/link"
import { Plus } from "lucide-react"
import { AppointmentFilters } from "@/components/turnos/appointment-filters"
import { AppointmentTable } from "@/components/turnos/appointment-table"
import { DaySummaryPanel } from "@/components/turnos/day-summary-panel"
import { ExportarTurnosButtons } from "@/components/turnos/ExportarTurnosButtons"

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

  // Construir filtros para getTurnos
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

  // Obtener turnos usando helper
  const turnos = await getTurnos({
    profesionalId: searchParams.profesionalId,
    estado: searchParams.estado,
    fecha: fechaFilter,
    orderBy: { fecha: "asc" },
    take: 100,
  })

  // Filtrar por búsqueda de paciente si existe (post-procesamiento)
  let turnosFiltrados = turnos
  if (searchParams.search) {
    const searchLower = searchParams.search.toLowerCase()
    turnosFiltrados = turnos.filter(
      (t) =>
        t.paciente?.nombre?.toLowerCase().includes(searchLower) ||
        t.paciente?.email?.toLowerCase().includes(searchLower)
    )
  }

  // Filtrar por especialidad si existe (post-procesamiento)
  // Necesitamos obtener las especialidades de los profesionales
  if (searchParams.especialidad) {
    const profesionalIds = turnosFiltrados
      .map((t) => t.profesional?.id)
      .filter((id): id is string => id !== undefined)
    if (profesionalIds.length > 0) {
      const placeholders = profesionalIds.map(() => "?").join(",")
      const profesionalesEspecialidades =
        await prisma.$queryRawUnsafe<Array<{
          id: string
          especialidad: string
        }>>(
          `SELECT id, especialidad FROM Profesional WHERE id IN (${placeholders})`,
          ...profesionalIds
        )
      const especialidadesMap = new Map(
        profesionalesEspecialidades.map((p) => [p.id, p.especialidad])
      )
      turnosFiltrados = turnosFiltrados.filter((t) => {
        const especialidad = t.profesional?.id
          ? especialidadesMap.get(t.profesional.id)
          : undefined
        return especialidad === searchParams.especialidad
      })
    } else {
      turnosFiltrados = []
    }
  }

  // Obtener profesionales usando SQL raw
  const profesionalesRaw = await prisma.$queryRawUnsafe<Array<{
    id: string
    userId: string
    especialidad: string
  }>>(`SELECT id, userId, especialidad FROM Profesional`)

  // Obtener usuarios de los profesionales
  const userIds = profesionalesRaw.map((p) => p.userId)
  let usuarios: Array<{ id: string; nombre: string }> = []
  if (userIds.length > 0) {
    const placeholders = userIds.map(() => "?").join(",")
    usuarios = await prisma.$queryRawUnsafe<Array<{
      id: string
      nombre: string
    }>>(
      `SELECT id, nombre FROM User WHERE id IN (${placeholders})`,
      ...userIds
    )
  }

  const usuariosMap = new Map(usuarios.map((u) => [u.id, u]))
  const profesionales = profesionalesRaw.map((p) => ({
    id: p.id,
    especialidad: p.especialidad,
    user: usuariosMap.get(p.userId) || { nombre: "" },
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
