import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Calendar, FileText } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { ProfessionalAppointmentsWrapper } from "@/components/turnos/professional-appointments-wrapper"
import { format } from "date-fns"
import { AppointmentStatusBadge } from "@/components/turnos/appointment-status-badge"
import { PatientAvatar } from "@/components/patients/patient-avatar"

export default async function ProfesionalTurnosPage() {
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

  const turnosRaw = await prisma.turno.findMany({
    where: { profesionalId: profesional.id, eliminadoAt: null },
    orderBy: { fecha: "desc" },
    include: {
      paciente: { select: { id: true, nombre: true, email: true } },
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

  // Próximo turno
  const proximoTurno = turnos.find(
    (t) =>
      new Date(t.fecha) >= new Date() &&
      (t.estado === "PENDIENTE" || t.estado === "CONFIRMADO")
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Mis Turnos"
        subtitle="Gestione sus turnos y acceda a la historia clínica de sus pacientes"
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard/profesional" },
          { label: "Turnos" },
        ]}
        action={
          <Link href="/dashboard/profesional/horarios">
            <Button
              variant="outline"
              className="rounded-xl border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all duration-200 ease-out"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Gestionar horarios
            </Button>
          </Link>
        }
      />

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
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6">
                <ProfessionalAppointmentsWrapper
                  turnos={turnos as any}
                  basePath="/dashboard/profesional/turnos"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral - Próximo turno */}
        <div className="lg:col-span-1">
          {proximoTurno ? (
            <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
              <CardHeader className="border-b border-[#E2E8F0]">
                <CardTitle className="text-lg font-semibold text-[#0F172A] font-inter">
                  Próximo turno
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col items-center mb-4">
                  <PatientAvatar
                    name={proximoTurno.paciente?.nombre ?? "—"}
                    size="lg"
                    className="mb-4"
                  />
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
                  <div className="flex gap-2 pt-2">
                    <Link
                      href={`/dashboard/profesional/historia-clinica/${proximoTurno.pacienteId}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        className="w-full rounded-xl border-[#E2E8F0] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-all duration-200 ease-out"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Historia
                      </Button>
                    </Link>
                    <Link
                      href={`/dashboard/profesional/turnos/${proximoTurno.id}`}
                      className="flex-1"
                    >
                      <Button className="w-full bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium transition-all duration-200 ease-out hover:scale-[1.02]">
                        Ver detalle
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
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
