import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { countTurnos, getTurnos } from "@/lib/turno-helpers"
import { countProfesionales } from "@/lib/profesional-helpers"
import { MetricCard } from "@/components/dashboard/metric-card"
import { PageHeader } from "@/components/ui/page-header"
import { CardContainer } from "@/components/ui/card-container"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Calendar,
  Users,
  UserCircle,
  Clock,
  Activity,
  CalendarDays,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  // Estadísticas
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const mañana = new Date(hoy)
  mañana.setDate(mañana.getDate() + 1)

  const turnosHoy = await countTurnos({
    fecha: { gte: hoy, lt: mañana },
  })

  const pacientesAtendidos = await countTurnos({
    estado: "COMPLETADO",
  })

  const profesionalesActivos = await countProfesionales()

  const turnosPendientes = await countTurnos({
    estado: "PENDIENTE",
  })

  // Próximos turnos
  const proximosTurnos = await getTurnos({
    fecha: { gte: hoy },
    estado: ["PENDIENTE", "CONFIRMADO"],
    take: 5,
    orderBy: { fecha: "asc" },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Bienvenido, ${session.user.name}`}
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
          title="Profesionales activos"
          value={profesionalesActivos}
          icon={<UserCircle className="h-6 w-6" style={{ color: "#7C3AED" }} strokeWidth={1.5} />}
          iconColor="#7C3AED"
        />
        <MetricCard
          title="Turnos pendientes"
          value={turnosPendientes}
          icon={<Clock className="h-6 w-6" style={{ color: "#F59E0B" }} strokeWidth={1.5} />}
          iconColor="#F59E0B"
        />
      </div>

      {/* Panel principal */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Próximos turnos */}
        <CardContainer
          title="Próximos turnos"
          action={
            <Link
              href="/dashboard/admin/turnos"
              className="text-sm text-[#2563EB] hover:text-[#1E40AF] transition-colors duration-200 ease-out font-medium"
            >
              Ver todos
            </Link>
          }
          contentClassName="p-0"
        >
          {proximosTurnos.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-12 w-12 text-[#64748B]" strokeWidth={1.5} />}
              title="No hay turnos próximos"
              description="No se encontraron turnos programados para los próximos días"
              action={{
                label: "Crear turno",
                href: "/dashboard/admin/turnos/nuevo",
                variant: "default",
              }}
            />
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {proximosTurnos.map((turno) => (
                <div
                  key={turno.id}
                  className="p-4 hover:bg-[#F8FAFC] transition-colors duration-200 ease-out"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#0F172A]">
                        {turno.paciente.nombre}
                      </p>
                      <p className="text-xs text-[#64748B] mt-1">
                        {turno.profesional?.user?.nombre || "Sin profesional"}
                      </p>
                      <p className="text-xs text-[#64748B] mt-1">
                        {format(new Date(turno.fecha), "dd/MM/yyyy")} a las{" "}
                        {turno.hora}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        turno.estado === "CONFIRMADO"
                          ? "bg-[#EFF6FF] text-[#2563EB]"
                          : "bg-[#FEF3C7] text-[#F59E0B]"
                      }`}
                    >
                      {turno.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContainer>

        {/* Actividad reciente */}
        <CardContainer
          title={
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-[#2563EB]" />
              Actividad reciente
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-[#2563EB] mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0F172A]">
                  Nuevo turno creado
                </p>
                <p className="text-xs text-[#64748B] mt-1">Hace 5 minutos</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-[#0EA5A4] mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0F172A]">
                  Paciente registrado
                </p>
                <p className="text-xs text-[#64748B] mt-1">Hace 15 minutos</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 rounded-full bg-[#7C3AED] mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0F172A]">
                  Turno completado
                </p>
                <p className="text-xs text-[#64748B] mt-1">Hace 1 hora</p>
              </div>
            </div>
          </div>
        </CardContainer>
      </div>
    </div>
  )
}
