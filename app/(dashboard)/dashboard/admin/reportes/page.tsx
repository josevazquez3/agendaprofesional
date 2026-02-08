import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { MetricCard } from "@/components/dashboard/metric-card"
import { countTurnos, getTurnos } from "@/lib/turno-helpers"
import { countUsers } from "@/lib/user-helpers"
import { countProfesionales } from "@/lib/profesional-helpers"
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
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

export default async function AdminReportesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const hoy = new Date()
  const inicioMes = startOfMonth(hoy)
  const finMes = endOfMonth(hoy)
  const hace30Dias = subDays(hoy, 30)

  // Estadísticas generales
  const totalPacientes = await countUsers({ role: "PACIENTE" })
  const totalProfesionales = await countProfesionales()
  const turnosMes = await countTurnos({
    fecha: { gte: inicioMes, lte: finMes },
  })
  const turnosCompletados = await countTurnos({
    estado: "COMPLETADO",
    fecha: { gte: inicioMes, lte: finMes },
  })
  const turnosCancelados = await countTurnos({
    estado: "CANCELADO",
    fecha: { gte: inicioMes, lte: finMes },
  })
  const turnosPendientes = await countTurnos({
    estado: "PENDIENTE",
  })

  // Estadísticas de los últimos 30 días
  const turnosUltimos30Dias = await countTurnos({
    fecha: { gte: hace30Dias, lte: hoy },
  })

  // Obtener turnos por día de la semana
  const turnosPorDia = await prisma.$queryRawUnsafe<Array<{
    dia: string
    cantidad: bigint | number
  }>>(
    `SELECT 
      CASE CAST(strftime('%w', fecha) AS INTEGER)
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Lunes'
        WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
      END as dia,
      COUNT(*) as cantidad
    FROM Turno
    WHERE fecha >= ? AND fecha <= ?
    GROUP BY CAST(strftime('%w', fecha) AS INTEGER)
    ORDER BY CAST(strftime('%w', fecha) AS INTEGER)`,
    inicioMes.toISOString().split('T')[0],
    finMes.toISOString().split('T')[0]
  )

  // Obtener turnos por profesional
  const turnosPorProfesional = await prisma.$queryRawUnsafe<Array<{
    profesionalId: string
    nombre: string
    cantidad: bigint | number
  }>>(
    `SELECT 
      t.profesionalId,
      u.nombre,
      COUNT(*) as cantidad
    FROM Turno t
    INNER JOIN Profesional p ON t.profesionalId = p.id
    INNER JOIN User u ON p.userId = u.id
    WHERE t.fecha >= ? AND t.fecha <= ?
    GROUP BY t.profesionalId, u.nombre
    ORDER BY cantidad DESC
    LIMIT 10`,
    inicioMes.toISOString().split('T')[0],
    finMes.toISOString().split('T')[0]
  )

  // Obtener turnos por estado
  const turnosPorEstado = await prisma.$queryRawUnsafe<Array<{
    estado: string
    cantidad: bigint | number
  }>>(
    `SELECT estado, COUNT(*) as cantidad
    FROM Turno
    WHERE fecha >= ? AND fecha <= ?
    GROUP BY estado`,
    inicioMes.toISOString().split('T')[0],
    finMes.toISOString().split('T')[0]
  )

  // Calcular tasa de completitud
  const tasaCompletitud =
    turnosMes > 0 ? Math.round((turnosCompletados / turnosMes) * 100) : 0

  // Calcular tasa de cancelación
  const tasaCancelacion =
    turnosMes > 0 ? Math.round((turnosCancelados / turnosMes) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes y Estadísticas"
        subtitle="Análisis completo del rendimiento de la clínica"
      />

      {/* Métricas principales */}
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

      {/* Estadísticas de turnos */}
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
                const cantidad = typeof item.cantidad === 'bigint' ? Number(item.cantidad) : item.cantidad
                const porcentaje = turnosMes > 0 ? Math.round((cantidad / turnosMes) * 100) : 0
                return (
                  <div key={item.estado} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#0F172A]">
                        {item.estado}
                      </span>
                      <span className="text-sm text-[#64748B]">
                        {cantidad} ({porcentaje}%)
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
                const cantidad = typeof item.cantidad === 'bigint' ? Number(item.cantidad) : item.cantidad
                const maxCantidad = Math.max(...turnosPorDia.map(t => typeof t.cantidad === 'bigint' ? Number(t.cantidad) : t.cantidad))
                const porcentaje = maxCantidad > 0 ? Math.round((cantidad / maxCantidad) * 100) : 0
                return (
                  <div key={item.dia} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#0F172A]">
                        {item.dia}
                      </span>
                      <span className="text-sm text-[#64748B]">{cantidad}</span>
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

      {/* Top profesionales */}
      <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-[#2563EB]" />
            Top Profesionales del Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {turnosPorProfesional.length === 0 ? (
            <p className="text-sm text-[#64748B] text-center py-4">
              No hay datos disponibles
            </p>
          ) : (
            <div className="space-y-3">
              {turnosPorProfesional.map((item, index) => {
                const cantidad = typeof item.cantidad === 'bigint' ? Number(item.cantidad) : item.cantidad
                return (
                  <div
                    key={item.profesionalId}
                    className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-[#0F172A]">
                        {item.nombre}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[#2563EB]">
                      {cantidad} turnos
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen del mes */}
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
              <span className="text-lg font-semibold text-[#0F172A]">
                {turnosCompletados}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-[#EF4444]" />
                <span className="text-sm text-[#64748B]">Cancelados</span>
              </div>
              <span className="text-lg font-semibold text-[#0F172A]">
                {turnosCancelados}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#F59E0B]" />
                <span className="text-sm text-[#64748B]">Pendientes</span>
              </div>
              <span className="text-lg font-semibold text-[#0F172A]">
                {turnosPendientes}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Últimos 30 Días</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#0F172A] mb-2">
              {turnosUltimos30Dias}
            </div>
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
                <span className="text-sm font-semibold text-[#10B981]">
                  {tasaCompletitud}%
                </span>
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
                <span className="text-sm font-semibold text-[#EF4444]">
                  {tasaCancelacion}%
                </span>
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
