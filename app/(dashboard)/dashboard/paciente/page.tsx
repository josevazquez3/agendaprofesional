import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, FileText, Clock } from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function PacienteDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "PACIENTE") {
    redirect("/auth/login")
  }

  const turnosProximos = await prisma.turno.findMany({
    where: {
      pacienteId: session.user.id,
      estado: { in: ["PENDIENTE", "CONFIRMADO"] },
      fecha: { gte: new Date() },
      eliminadoAt: null,
    },
    orderBy: { fecha: "asc" },
    take: 5,
    include: {
      profesional: {
        select: {
          especialidad: true,
          user: { select: { nombre: true } },
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bienvenido, {session.user.name}</h1>
        <p className="text-gray-600 mt-2">Panel de control del paciente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Mis Turnos
            </CardTitle>
            <CardDescription>Gestiona tus turnos médicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-4">{turnosProximos.length}</div>
            <Link href="/dashboard/paciente/turnos">
              <Button className="w-full">Ver Turnos</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Historia Clínica
            </CardTitle>
            <CardDescription>Accede a tu historial médico</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/paciente/historia-clinica">
              <Button className="w-full" variant="outline">
                Ver Historia
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Solicitar Turno
            </CardTitle>
            <CardDescription>Reserva un nuevo turno</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/paciente/turnos/nuevo">
              <Button className="w-full">Nuevo Turno</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {turnosProximos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Próximos Turnos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {turnosProximos.map((turno) => (
                <div
                  key={turno.id}
                  className="flex justify-between items-center p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      {turno.profesional?.user?.nombre ?? "—"} -{" "}
                      {turno.profesional?.especialidad ?? "—"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(turno.fecha).toLocaleDateString("es-AR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      a las {turno.hora}
                    </p>
                    {/* Consultorio info removed - not available in TurnoWithRelations */}
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        turno.estado === "CONFIRMADO"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {turno.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
