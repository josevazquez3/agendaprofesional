import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { Building2, Users, UserCheck, Calendar, CreditCard, AlertCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default async function PlatformAdminPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "PLATFORM_OWNER") {
    redirect("/dashboard")
  }

  // Obtener todas las clínicas con sus métricas
  const clinics = await prisma.clinic.findMany({
    include: {
      plan: {
        select: {
          nombre: true,
          precioMensual: true,
        },
      },
      subscriptions: {
        where: {
          status: {
            in: ["active", "trial"],
          },
        },
        take: 1,
      },
      _count: {
        select: {
          usuarios: {
            where: {
              activo: true,
            },
          },
          profesionales: true,
          turnos: {
            where: {
              fecha: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Estadísticas generales
  const totalClinics = clinics.length
  const activeClinics = clinics.filter((c) => c.activo).length
  const totalUsers = clinics.reduce((sum, c) => sum + c._count.usuarios, 0)
  const totalProfessionals = clinics.reduce((sum, c) => sum + c._count.profesionales, 0)
  const totalAppointments = clinics.reduce((sum, c) => sum + c._count.turnos, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administración de Plataforma"
        subtitle="Gestión de clínicas y suscripciones"
      />

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B] mb-1">Total Clínicas</p>
                <p className="text-2xl font-bold text-[#0F172A]">{totalClinics}</p>
              </div>
              <Building2 className="h-8 w-8 text-[#2563EB]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B] mb-1">Clínicas Activas</p>
                <p className="text-2xl font-bold text-[#10B981]">{activeClinics}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-[#10B981]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B] mb-1">Total Usuarios</p>
                <p className="text-2xl font-bold text-[#0F172A]">{totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-[#0EA5A4]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B] mb-1">Profesionales</p>
                <p className="text-2xl font-bold text-[#0F172A]">{totalProfessionals}</p>
              </div>
              <UserCheck className="h-8 w-8 text-[#7C3AED]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#64748B] mb-1">Turnos del Mes</p>
                <p className="text-2xl font-bold text-[#0F172A]">{totalAppointments}</p>
              </div>
              <Calendar className="h-8 w-8 text-[#F59E0B]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de clínicas */}
      <Card>
        <CardHeader>
          <CardTitle>Clínicas Registradas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                    Clínica
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                    Plan
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                    Usuarios
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                    Profesionales
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                    Turnos/Mes
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {clinics.map((clinic) => {
                  const subscription = clinic.subscriptions[0]
                  return (
                    <tr key={clinic.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-[#0F172A]">{clinic.nombre}</p>
                          <p className="text-sm text-[#64748B]">{clinic.slug}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {clinic.plan ? (
                          <div>
                            <p className="font-medium text-[#0F172A]">{clinic.plan.nombre}</p>
                            <p className="text-sm text-[#64748B]">
                              ${clinic.plan.precioMensual}/mes
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-[#64748B]">Sin plan</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={clinic.activo ? "default" : "secondary"}
                            className="w-fit"
                          >
                            {clinic.activo ? "Activa" : "Suspendida"}
                          </Badge>
                          {subscription && (
                            <Badge
                              variant={
                                subscription.status === "active"
                                  ? "default"
                                  : subscription.status === "trial"
                                  ? "outline"
                                  : "secondary"
                              }
                              className="w-fit text-xs"
                            >
                              {subscription.status === "active"
                                ? "Suscripción Activa"
                                : subscription.status === "trial"
                                ? "Trial"
                                : subscription.status}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-[#0F172A]">{clinic._count.usuarios}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-[#0F172A]">{clinic._count.profesionales}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-[#0F172A]">{clinic._count.turnos}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <Link href={`/platform-admin/clinics/${clinic.id}`}>
                            <Button variant="outline" size="sm" className="rounded-xl">
                              Ver Detalles
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
