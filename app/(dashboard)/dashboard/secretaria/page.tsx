import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
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

const sinEliminados = { eliminadoAt: null }

export default async function SecretariaDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== "SECRETARIA" && session.user.role !== "ADMIN")) {
    redirect("/auth/login")
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const mañana = new Date(hoy)
  mañana.setDate(mañana.getDate() + 1)

  const [
    turnosHoy,
    pacientesAtendidos,
    cancelacionesHoy,
    turnosPendientes,
    turnosDelDiaRaw,
    turnosConfirmadosCount,
    turnosPendientesHoyCount,
    turnosProximos2HorasData,
    pacientesEnEsperaData,
    turnosDelDiaCompletos,
  ] = await Promise.all([
    prisma.turno.count({
      where: { fecha: { gte: hoy, lt: mañana }, ...sinEliminados },
    }),
    prisma.turno.count({
      where: {
        fecha: { gte: hoy, lt: mañana },
        estado: "COMPLETADO",
        ...sinEliminados,
      },
    }),
    prisma.turno.count({
      where: {
        fecha: { gte: hoy, lt: mañana },
        estado: "CANCELADO",
        ...sinEliminados,
      },
    }),
    prisma.turno.count({
      where: { estado: "PENDIENTE", ...sinEliminados },
    }),
    prisma.turno.findMany({
      where: { fecha: { gte: hoy, lt: mañana }, ...sinEliminados },
      orderBy: { hora: "asc" },
      take: 10,
      include: {
        paciente: { select: { id: true, nombre: true, email: true } },
        profesional: {
          select: {
            id: true,
            user: { select: { id: true, nombre: true } },
          },
        },
      },
    }),
    prisma.turno.count({
      where: {
        fecha: { gte: hoy, lt: mañana },
        estado: "CONFIRMADO",
        ...sinEliminados,
      },
    }),
    prisma.turno.count({
      where: {
        fecha: { gte: hoy, lt: mañana },
        estado: "PENDIENTE",
        ...sinEliminados,
      },
    }),
    prisma.turno.findMany({
      where: {
        fecha: { gte: hoy, lt: mañana },
        estado: { in: ["PENDIENTE", "CONFIRMADO"] },
        ...sinEliminados,
      },
      select: { hora: true },
    }),
    prisma.turno.findMany({
      where: {
        fecha: { gte: hoy, lt: mañana },
        estado: "CONFIRMADO",
        ...sinEliminados,
      },
      select: { hora: true },
    }),
    prisma.turno.findMany({
      where: {
        fecha: { gte: hoy, lt: mañana },
        estado: { in: ["CONFIRMADO", "COMPLETADO"] },
        ...sinEliminados,
      },
      select: { hora: true },
    }),
  ])

  const turnosDelDia = turnosDelDiaRaw.map((t) => ({
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
          user: t.profesional.user ? { nombre: t.profesional.user.nombre } : undefined,
        }
      : undefined,
  }))

  const ahora = new Date()
  const horaActual = ahora.toTimeString().slice(0, 5)
  const en2Horas = new Date(ahora.getTime() + 2 * 60 * 60 * 1000)
  const horaEn2Horas = en2Horas.toTimeString().slice(0, 5)

  const turnosProximos2Horas = turnosProximos2HorasData.filter(
    (turno) => turno.hora >= horaActual && turno.hora <= horaEn2Horas
  ).length

  const pacientesEnEspera = pacientesEnEsperaData.filter((turno) => turno.hora <= horaActual).length

  const hace15Min = new Date(ahora.getTime() - 15 * 60 * 1000)
  const horaHace15Min = hace15Min.toTimeString().slice(0, 5)
  const turnosAtrasados = pacientesEnEsperaData.filter((turno) => turno.hora <= horaHace15Min).length

  const slotsDisponibles = 20
  const slotsOcupados = turnosDelDiaCompletos.length
  const ocupacionPorcentaje = Math.round((slotsOcupados / slotsDisponibles) * 100)

  const horasConTurnos: Record<string, number> = {}
  turnosDelDiaCompletos.forEach((turno) => {
    const hora = turno.hora.slice(0, 2)
    horasConTurnos[hora] = (horasConTurnos[hora] || 0) + 1
  })
  const horasPico = Object.entries(horasConTurnos)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hora]) => `${hora}:00`)

  const huecosDisponibles = Math.max(0, slotsDisponibles - slotsOcupados)

  return (
    <div className="space-y-6">
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

      <QuickActionsBar role={session.user.role as "SECRETARIA" | "ADMIN"} />

      <OperationalSummaryCards
        turnosProximos2Horas={turnosProximos2Horas}
        pacientesEnEspera={pacientesEnEspera}
        turnosAtrasados={turnosAtrasados}
        cancelacionesDelDia={cancelacionesHoy}
      />

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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm">
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
        <div className="lg:col-span-1 space-y-6">
          <DaySummaryPanel
            turnosConfirmados={turnosConfirmadosCount}
            turnosPendientes={turnosPendientesHoyCount}
            turnosCancelados={cancelacionesHoy}
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
