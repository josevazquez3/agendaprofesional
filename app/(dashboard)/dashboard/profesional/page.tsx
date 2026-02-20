import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { Calendar, Users, Clock, FileText } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"
import { MetricCard } from "@/components/dashboard/metric-card"
import { format } from "date-fns"
import { AppointmentStatusBadge } from "@/components/turnos/appointment-status-badge"
import { PatientAvatar } from "@/components/patients/patient-avatar"
import { QuickActionsBar } from "@/components/quick-actions/quick-actions-bar"
import { OperationalSummaryCards } from "@/components/operational/operational-summary-cards"

export default async function ProfesionalDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "PROFESIONAL") {
    redirect("/auth/login")
  }

  const profesional = await prisma.profesional.findUnique({
    where: { userId: session.user.id },
  })

  if (!profesional) {
    redirect("/dashboard")
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const mañana = new Date(hoy)
  mañana.setDate(mañana.getDate() + 1)
  const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [turnosHoy, proximosTurnos, pacientesRecientesData, cancelacionesDelDia] = await Promise.all([
    prisma.turno.findMany({
      where: {
        profesionalId: profesional.id,
        fecha: { gte: hoy, lt: mañana },
        estado: { in: ["PENDIENTE", "CONFIRMADO"] },
        eliminadoAt: null,
      },
      orderBy: { hora: "asc" },
      include: {
        paciente: { select: { id: true, nombre: true } },
      },
    }),
    prisma.turno.findMany({
      where: {
        profesionalId: profesional.id,
        fecha: { gte: hoy },
        estado: { in: ["PENDIENTE", "CONFIRMADO"] },
        eliminadoAt: null,
      },
      orderBy: { fecha: "asc" },
      take: 5,
      include: {
        paciente: { select: { id: true, nombre: true } },
      },
    }),
    prisma.turno.findMany({
      where: {
        profesionalId: profesional.id,
        fecha: { gte: hace30Dias },
        estado: "COMPLETADO",
        eliminadoAt: null,
      },
      take: 100,
      include: {
        paciente: { select: { id: true, nombre: true } },
      },
    }),
    prisma.turno.count({
      where: {
        profesionalId: profesional.id,
        fecha: { gte: hoy, lt: mañana },
        estado: "CANCELADO",
        eliminadoAt: null,
      },
    }),
  ])

  const pacientesUnicos = new Map<string, { paciente: { id: string; nombre: string } }>()
  pacientesRecientesData.forEach((turno) => {
    if (turno.paciente && !pacientesUnicos.has(turno.pacienteId)) {
      pacientesUnicos.set(turno.pacienteId, {
        paciente: {
          id: turno.pacienteId,
          nombre: turno.paciente.nombre ?? "—",
        },
      })
    }
  })
  const pacientesRecientes = Array.from(pacientesUnicos.values()).slice(0, 5)

  const proximoTurno = proximosTurnos.length > 0 ? proximosTurnos[0] : null

  const ahora = new Date()
  const en2Horas = new Date(ahora.getTime() + 2 * 60 * 60 * 1000)
  const hoyString = hoy.toISOString().split("T")[0]

  const turnosProximos2Horas = turnosHoy.filter((turno) => {
    const turnoFecha = new Date(turno.fecha).toISOString().split("T")[0]
    return turnoFecha === hoyString && turno.hora >= ahora.toTimeString().slice(0, 5) && turno.hora <= en2Horas.toTimeString().slice(0, 5)
  }).length

  const pacientesEnEspera = turnosHoy.filter((turno) => {
    const turnoFecha = new Date(turno.fecha).toISOString().split("T")[0]
    return turnoFecha === hoyString && turno.estado === "CONFIRMADO" && turno.hora <= ahora.toTimeString().slice(0, 5)
  }).length

  const hace15Min = new Date(ahora.getTime() - 15 * 60 * 1000)
  const turnosAtrasados = turnosHoy.filter((turno) => {
    const turnoFecha = new Date(turno.fecha).toISOString().split("T")[0]
    return turnoFecha === hoyString && turno.estado === "CONFIRMADO" && turno.hora <= hace15Min.toTimeString().slice(0, 5)
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`Bienvenido, ${session.user.name}`}
        subtitle="Panel de control profesional"
      />

      {/* Quick Actions Bar */}
      <QuickActionsBar role="PROFESIONAL" />

      {/* Resúmenes operativos */}
      <OperationalSummaryCards
        turnosProximos2Horas={turnosProximos2Horas}
        pacientesEnEspera={pacientesEnEspera}
        turnosAtrasados={turnosAtrasados}
        cancelacionesDelDia={cancelacionesDelDia}
      />

      {/* Métricas superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          title="Turnos hoy"
          value={turnosHoy.length}
          icon={<Calendar className="h-6 w-6" style={{ color: "#2563EB" }} strokeWidth={1.5} />}
          iconColor="#2563EB"
        />
        <MetricCard
          title="Próximos turnos"
          value={proximosTurnos.length}
          icon={<Clock className="h-6 w-6" style={{ color: "#0EA5A4" }} strokeWidth={1.5} />}
          iconColor="#0EA5A4"
        />
        <MetricCard
          title="Pacientes recientes"
          value={pacientesRecientes.length}
          icon={<Users className="h-6 w-6" style={{ color: "#7C3AED" }} strokeWidth={1.5} />}
          iconColor="#7C3AED"
        />
      </div>

      {/* Panel principal */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Turnos próximos */}
        <div className="lg:col-span-2">
          <Card className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm">
            <CardHeader className="border-b border-[#E2E8F0]">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold text-[#0F172A] font-inter">
                    Próximos turnos
                  </CardTitle>
                  <p className="text-sm text-[#64748B] mt-1">
                    {proximosTurnos.length} turno{proximosTurnos.length !== 1 ? "s" : ""}{" "}
                    programado{proximosTurnos.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Link href="/dashboard/profesional/turnos">
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
            <CardContent className="p-6">
              {proximosTurnos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#64748B] text-sm">
                    No hay turnos próximos programados
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {proximosTurnos.map((turno) => (
                    <div
                      key={turno.id}
                      className="flex items-center justify-between p-4 border border-[#E2E8F0] rounded-xl hover:bg-[#F8FAFC] transition-all duration-200 ease-out"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <PatientAvatar name={turno.paciente?.nombre ?? "—"} size="sm" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-sm font-semibold text-[#0F172A]">
                              {turno.paciente?.nombre ?? "—"}
                            </h3>
                            <AppointmentStatusBadge status={turno.estado} />
                          </div>
                          <p className="text-xs text-[#64748B]">
                            {format(new Date(turno.fecha), "dd/MM/yyyy")} a las {turno.hora}
                          </p>
                          {turno.motivo && (
                            <p className="text-xs text-[#64748B] mt-1">
                              {turno.motivo}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link href={`/dashboard/profesional/historia-clinica/${turno.pacienteId}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-all duration-200 ease-out"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Historia
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral - Próximo turno */}
        <div className="lg:col-span-1">
          {proximoTurno ? (
            <Card className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm">
              <CardHeader className="border-b border-[#E2E8F0]">
                <CardTitle className="text-lg font-semibold text-[#0F172A] font-inter">
                  Próximo turno
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col items-center mb-4">
                  <PatientAvatar name={proximoTurno.paciente?.nombre ?? "—"} size="lg" className="mb-4" />
                  <h3 className="text-lg font-semibold text-[#0F172A] font-inter text-center mb-2">
                    {proximoTurno.paciente?.nombre ?? "—"}
                  </h3>
                  <AppointmentStatusBadge status={proximoTurno.estado} />
                </div>
                <div className="space-y-3 pt-4 border-t border-[#E2E8F0]">
                  <div>
                    <p className="text-xs text-[#64748B] mb-1">Fecha y hora</p>
                    <p className="text-sm font-medium text-[#0F172A]">
                      {format(new Date(proximoTurno.fecha), "dd/MM/yyyy")} a las{" "}
                      {proximoTurno.hora}
                    </p>
                  </div>
                  {proximoTurno.motivo && (
                    <div>
                      <p className="text-xs text-[#64748B] mb-1">Motivo</p>
                      <p className="text-sm text-[#0F172A]">{proximoTurno.motivo}</p>
                    </div>
                  )}
                  <Link href={`/dashboard/profesional/turnos/${proximoTurno.id}`}>
                    <Button className="w-full bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium transition-all duration-200 ease-out hover:scale-[1.02]">
                      Ver detalles
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm">
              <CardContent className="p-6 text-center">
                <p className="text-[#64748B] text-sm">No hay turnos próximos</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
