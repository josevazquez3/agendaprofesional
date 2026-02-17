import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { MetricCard } from "@/components/dashboard/metric-card"
import { prisma } from "@/lib/prisma"
import {
  Calendar,
  Users,
  UserCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react"
import { startOfMonth, endOfMonth, subDays } from "date-fns"

const DIAS_NOMBRE = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const sinEliminados = { eliminadoAt: null }

export default async function AdminReportesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const hoy = new Date()
  const inicioMes = startOfMonth(hoy)
  const finMes = endOfMonth(hoy)
  const hace30Dias = subDays(hoy, 30)

  const [
    totalPacientes,
    totalProfesionales,
    turnosMes,
    turnosCompletados,
    turnosCancelados,
    turnosPendientes,
    turnosUltimos30Dias,
    turnosMesParaGrupos,
    turnosPorEstadoRows,
    turnosPorProfesionalRows,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "PACIENTE" } }),
    prisma.profesional.count(),
    prisma.turno.count({
      where: { fecha: { gte: inicioMes, lte: finMes }, ...sinEliminados },
    }),
    prisma.turno.count({
      where: {
        estado: "COMPLETADO",
        fecha: { gte: inicioMes, lte: finMes },
        ...sinEliminados,
      },
    }),
    prisma.turno.count({
      where: {
        estado: "CANCELADO",
        fecha: { gte: inicioMes, lte: finMes },
        ...sinEliminados,
      },
    }),
    prisma.turno.count({
      where: { estado: "PENDIENTE", ...sinEliminados },
    }),
    prisma.turno.count({
      where: { fecha: { gte: hace30Dias, lte: hoy }, ...sinEliminados },
    }),
    prisma.turno.findMany({
      where: { fecha: { gte: inicioMes, lte: finMes }, ...sinEliminados },
      select: { fecha: true },
    }),
    prisma.turno.groupBy({
      by: ["estado"],
      where: { fecha: { gte: inicioMes, lte: finMes }, ...sinEliminados },
      _count: { id: true },
    }),
    prisma.turno.groupBy({
      by: ["profesionalId"],
      where: { fecha: { gte: inicioMes, lte: finMes }, ...sinEliminados },
      _count: { id: true },
    }),
  ])

  const turnosPorDia = DIAS_NOMBRE.map((dia, i) => {
    const cantidad = turnosMesParaGrupos.filter((t) => new Date(t.fecha).getDay() === i).length
    return { dia, cantidad }
  })

  const turnosPorEstado = turnosPorEstadoRows.map((r) => ({
    estado: r.estado,
    cantidad: r._count.id,
  }))

  const turnosPorProfesionalSorted = [...turnosPorProfesionalRows].sort(
    (a, b) => b._count.id - a._count.id
  )
  const profesionalIds = turnosPorProfesionalSorted.slice(0, 10).map((r) => r.profesionalId)
  const profesionalesMap = new Map<string, string>()
  if (profesionalIds.length > 0) {
    const profs = await prisma.profesional.findMany({
      where: { id: { in: profesionalIds } },
      select: { id: true, user: { select: { nombre: true } } },
    })
    profs.forEach((p) => profesionalesMap.set(p.id, p.user?.nombre ?? "—"))
  }

  const turnosPorProfesional = turnosPorProfesionalSorted.slice(0, 10).map((r) => ({
    profesionalId: r.profesionalId,
    nombre: profesionalesMap.get(r.profesionalId) ?? "—",
    cantidad: r._count.id,
  }))

  const tasaCompletitud =
    turnosMes > 0 ? Math.round((turnosCompletados / turnosMes) * 100) : 0
  const tasaCancelacion =
    turnosMes > 0 ? Math.round((turnosCancelados / turnosMes) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes y Estadísticas"
        subtitle="Análisis completo del rendimiento de la clínica"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Pacientes"
          value={totalPacientes}
          icon={<Users className="h-6 w-6" style={{ color: "#2563EB" }} strokeWidth={1.5} />}
          iconColor="#2563EB"
        />
        <MetricCard
          title="Profesionales Activos"
          value={totalProfesionales}
          icon={<UserCircle className="h-6 w-6" style={{ color: "#7C3AED" }} strokeWidth={1.5} />}
          iconColor="#7C3AED"
        />
        <MetricCard
          title="Turnos este Mes"
          value={turnosMes}
          icon={<Calendar className="h-6 w-6" style={{ color: "#0EA5A4" }} strokeWidth={1.5} />}
          iconColor="#0EA5A4"
        />
        <MetricCard
          title="Tasa de Completitud"
          value={`${tasaCompletitud}%`}
          icon={<TrendingUp className="h-6 w-6" style={{ color: "#10B981" }} strokeWidth={1.5} />}
          iconColor="#10B981"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#2563EB]" />
              Turnos por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {turnosPorEstado.map((item) => {
                const porcentaje = turnosMes > 0 ? Math.round((item.cantidad / turnosMes) * 100) : 0
                return (
                  <div key={item.estado} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#0F172A]">{item.estado}</span>
                      <span className="text-sm text-[#64748B]">
                        {item.cantidad} ({porcentaje}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2563EB] transition-all duration-500"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#2563EB]" />
              Turnos por Día de la Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {turnosPorDia.map((item) => {
                const maxCantidad = Math.max(...turnosPorDia.map((t) => t.cantidad))
                const porcentaje = maxCantidad > 0 ? Math.round((item.cantidad / maxCantidad) * 100) : 0
                return (
                  <div key={item.dia} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#0F172A]">{item.dia}</span>
                      <span className="text-sm text-[#64748B]">{item.cantidad}</span>
                    </div>
                    <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0EA5A4] transition-all duration-500"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-[#2563EB]" />
            Top Profesionales del Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {turnosPorProfesional.length === 0 ? (
            <p className="text-sm text-[#64748B] text-center py-4">No hay datos disponibles</p>
          ) : (
            <div className="space-y-3">
              {turnosPorProfesional.map((item, index) => (
                <div
                  key={item.profesionalId}
                  className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-[#0F172A]">{item.nombre}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#2563EB]">
                    {item.cantidad} turnos
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Resumen del Mes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#10B981]" />
                <span className="text-sm text-[#64748B]">Completados</span>
              </div>
              <span className="text-lg font-semibold text-[#0F172A]">{turnosCompletados}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-[#EF4444]" />
                <span className="text-sm text-[#64748B]">Cancelados</span>
              </div>
              <span className="text-lg font-semibold text-[#0F172A]">{turnosCancelados}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#F59E0B]" />
                <span className="text-sm text-[#64748B]">Pendientes</span>
              </div>
              <span className="text-lg font-semibold text-[#0F172A]">{turnosPendientes}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Últimos 30 Días</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#0F172A] mb-2">{turnosUltimos30Dias}</div>
            <p className="text-sm text-[#64748B]">Turnos totales</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Tasas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[#64748B]">Completitud</span>
                <span className="text-sm font-semibold text-[#10B981]">{tasaCompletitud}%</span>
              </div>
              <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10B981] transition-all duration-500"
                  style={{ width: `${tasaCompletitud}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[#64748B]">Cancelación</span>
                <span className="text-sm font-semibold text-[#EF4444]">{tasaCancelacion}%</span>
              </div>
              <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#EF4444] transition-all duration-500"
                  style={{ width: `${tasaCancelacion}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
