import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { getTurnosDelDia, countTurnos } from "@/lib/turno-helpers"
import { Calendar, Users, Clock, XCircle, Plus } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"
import { MetricCard } from "@/components/dashboard/metric-card"
import { AppointmentTable } from "@/components/turnos/appointment-table"
import { DaySummaryPanel } from "@/components/turnos/day-summary-panel"
import { QuickActionsBar } from "@/components/quick-actions/quick-actions-bar"
import { OperationalSummaryCards } from "@/components/operational/operational-summary-cards"
import { OccupationIndicator } from "@/components/operational/occupation-indicator"
import { format } from "date-fns"

export default async function SecretariaDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== "SECRETARIA" && session.user.role !== "ADMIN")) {
    redirect("/auth/login")
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const mañana = new Date(hoy)
  mañana.setDate(mañana.getDate() + 1)

  // Estadísticas del día usando helpers
  const turnosHoy = await countTurnos({
    fecha: { gte: hoy, lt: mañana },
  })

  const pacientesAtendidos = await countTurnos({
    fecha: { gte: hoy, lt: mañana },
    estado: "COMPLETADO",
  })

  const cancelacionesHoy = await countTurnos({
    fecha: { gte: hoy, lt: mañana },
    estado: "CANCELADO",
  })

  const turnosPendientes = await countTurnos({
    estado: "PENDIENTE",
  })

  // Turnos del día para la tabla
  const turnosDelDia = await getTurnosDelDia(hoy, mañana, 10)

  // Resumen del día
  const turnosConfirmados = await countTurnos({
    fecha: { gte: hoy, lt: mañana },
    estado: "CONFIRMADO",
  })

  const turnosPendientesHoy = await countTurnos({
    fecha: { gte: hoy, lt: mañana },
    estado: "PENDIENTE",
  })

  const turnosCanceladosHoy = cancelacionesHoy

  // Cálculos operativos
  const ahora = new Date()
  const horaActual = ahora.toTimeString().slice(0, 5)
  const en2Horas = new Date(ahora.getTime() + 2 * 60 * 60 * 1000)
  const horaEn2Horas = en2Horas.toTimeString().slice(0, 5)
  const fechaHoyStr = hoy.toISOString().split('T')[0]

  // Turnos próximos 2 horas (solo de hoy)
  const turnosProximos2HorasData = await prisma.$queryRawUnsafe<Array<{ hora: string }>>(
    `SELECT hora FROM Turno 
     WHERE date(fecha) = date(?) 
     AND estado IN ('PENDIENTE', 'CONFIRMADO')`,
    fechaHoyStr
  )

  const turnosProximos2Horas = turnosProximos2HorasData.filter(
    (turno) => turno.hora >= horaActual && turno.hora <= horaEn2Horas
  ).length

  // Pacientes en espera (turnos confirmados de hoy que ya pasaron su hora)
  const pacientesEnEsperaData = await prisma.$queryRawUnsafe<Array<{ hora: string }>>(
    `SELECT hora FROM Turno 
     WHERE date(fecha) = date(?) 
     AND estado = 'CONFIRMADO'`,
    fechaHoyStr
  )

  const pacientesEnEspera = pacientesEnEsperaData.filter(
    (turno) => turno.hora <= horaActual
  ).length

  // Turnos atrasados (turnos confirmados de hoy que pasaron su hora hace más de 15 min)
  const hace15Min = new Date(ahora.getTime() - 15 * 60 * 1000)
  const horaHace15Min = hace15Min.toTimeString().slice(0, 5)

  const turnosAtrasados = pacientesEnEsperaData.filter(
    (turno) => turno.hora <= horaHace15Min
  ).length

  // Calcular ocupación del día
  const turnosDelDiaCompletos = await prisma.$queryRawUnsafe<Array<{ hora: string }>>(
    `SELECT hora FROM Turno 
     WHERE date(fecha) = date(?) 
     AND estado IN ('CONFIRMADO', 'COMPLETADO')`,
    fechaHoyStr
  )

  // Asumir jornada de 8 horas (8:00 a 18:00) = 10 horas = 20 slots de 30 min
  const slotsDisponibles = 20
  const slotsOcupados = turnosDelDiaCompletos.length
  const ocupacionPorcentaje = Math.round((slotsOcupados / slotsDisponibles) * 100)

  // Horas pico (horas con más turnos)
  const horasConTurnos: Record<string, number> = {}
  turnosDelDiaCompletos.forEach((turno) => {
    const hora = turno.hora.slice(0, 2) // Solo la hora
    horasConTurnos[hora] = (horasConTurnos[hora] || 0) + 1
  })

  const horasPico = Object.entries(horasConTurnos)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hora]) => `${hora}:00`)

  // Huecos disponibles (slots sin turnos)
  const huecosDisponibles = Math.max(0, slotsDisponibles - slotsOcupados)

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`Bienvenida, ${session.user.name}`}
        subtitle="Panel de control de secretaría"
        action={
          <Link href="/dashboard/secretaria/turnos/nuevo">
            <Button className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium px-6 transition-all duration-200 ease-out hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo turno
            </Button>
          </Link>
        }
      />

      {/* Quick Actions Bar */}
      <QuickActionsBar role={session.user.role as "SECRETARIA" | "ADMIN"} />

      {/* Resúmenes operativos */}
      <OperationalSummaryCards
        turnosProximos2Horas={turnosProximos2Horas}
        pacientesEnEspera={pacientesEnEspera}
        turnosAtrasados={turnosAtrasados}
        cancelacionesDelDia={cancelacionesHoy}
      />

      {/* Métricas superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Turnos hoy"
          value={turnosHoy}
          icon={<Calendar className="h-6 w-6" style={{ color: "#2563EB" }} strokeWidth={1.5} />}
          iconColor="#2563EB"
        />
        <MetricCard
          title="Pacientes atendidos"
          value={pacientesAtendidos}
          icon={<Users className="h-6 w-6" style={{ color: "#0EA5A4" }} strokeWidth={1.5} />}
          iconColor="#0EA5A4"
        />
        <MetricCard
          title="Cancelaciones"
          value={cancelacionesHoy}
          icon={<XCircle className="h-6 w-6" style={{ color: "#EF4444" }} strokeWidth={1.5} />}
          iconColor="#EF4444"
        />
        <MetricCard
          title="Turnos pendientes"
          value={turnosPendientes}
          icon={<Clock className="h-6 w-6" style={{ color: "#F59E0B" }} strokeWidth={1.5} />}
          iconColor="#F59E0B"
        />
      </div>

      {/* Panel principal */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tabla de turnos del día */}
        <div className="lg:col-span-2">
          <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
            <CardHeader className="border-b border-[#E2E8F0]">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold text-[#0F172A] font-inter">
                    Turnos del día
                  </CardTitle>
                  <p className="text-sm text-[#64748B] mt-1">
                    {format(hoy, "dd/MM/yyyy")} - {turnosDelDia.length} turno
                    {turnosDelDia.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Link href="/dashboard/secretaria/turnos">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-[#2563EB] hover:bg-[#EFF6FF] transition-all duration-200 ease-out"
                  >
                    Ver todos
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6">
                <AppointmentTable
                  turnos={turnosDelDia as any}
                  basePath="/dashboard/secretaria/turnos"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="lg:col-span-1 space-y-6">
          <DaySummaryPanel
            turnosConfirmados={turnosConfirmados}
            turnosPendientes={turnosPendientesHoy}
            turnosCancelados={turnosCanceladosHoy}
            fecha={hoy}
          />
          <OccupationIndicator
            ocupacionPorcentaje={ocupacionPorcentaje}
            horasPico={horasPico}
            huecosDisponibles={huecosDisponibles}
          />
        </div>
      </div>
    </div>
  )
}
