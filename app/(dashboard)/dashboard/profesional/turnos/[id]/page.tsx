import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { getTurnoById } from "@/lib/turno-helpers"
import { formatDate, formatDateTime } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, User, MapPin, FileText, Building, Mail, Phone } from "lucide-react"
import { CancelTurnoButton } from "@/components/turnos/CancelTurnoButton"
import { CompletarTurnoButton } from "@/components/turnos/CompletarTurnoButton"

export default async function DetalleTurnoProfesionalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "PROFESIONAL") {
    redirect("/auth/login")
  }

  // Obtener profesional usando SQL raw
  const profesionalRaw = await prisma.$queryRawUnsafe<Array<{
    id: string
    userId: string
  }>>(
    `SELECT id, userId FROM Profesional WHERE userId = ? LIMIT 1`,
    session.user.id
  )

  if (profesionalRaw.length === 0) {
    redirect("/dashboard")
  }

  const profesional = profesionalRaw[0]

  // Obtener turno usando helper
  const turnoRaw = await getTurnoById(id)

  if (!turnoRaw) {
    redirect("/dashboard/profesional/turnos")
  }

  // Verificar que el profesional solo pueda ver sus propios turnos
  if (turnoRaw.profesionalId !== profesional.id) {
    redirect("/dashboard/profesional/turnos")
  }

  // Obtener información adicional del turno y consultorio
  const turnoCompleto = await prisma.$queryRawUnsafe<Array<{
    id: string
    obraSocial: string | null
    arancel: number | null
    motivoCancelacion: string | null
    canceladoAt: string | null
    motivoEliminacion: string | null
    eliminadoAt: string | null
  }>>(`SELECT id, obraSocial, arancel, motivoCancelacion, canceladoAt, motivoEliminacion, eliminadoAt FROM Turno WHERE id = ? LIMIT 1`, id)

  const turnoExtra = turnoCompleto.length > 0 ? turnoCompleto[0] : null

  // Obtener consultorio si existe
  let consultorioProfesional = null
  const consultorioData = await prisma.$queryRawUnsafe<Array<{
    consultorioId: string
    consultorioNombre: string
    consultorioDireccion: string | null
  }>>(
    `SELECT cp.consultorioId, c.nombre as consultorioNombre, c.direccion as consultorioDireccion
     FROM ConsultorioProfesional cp
     JOIN Consultorio c ON cp.consultorioId = c.id
     WHERE cp.profesionalId = ? LIMIT 1`,
    turnoRaw.profesionalId
  )

  if (consultorioData.length > 0) {
    consultorioProfesional = {
      consultorio: {
        nombre: consultorioData[0].consultorioNombre,
        direccion: consultorioData[0].consultorioDireccion,
      },
    }
  }

  // Obtener datos completos del paciente
  const pacienteCompleto = await prisma.$queryRawUnsafe<Array<{
    id: string
    nombre: string
    email: string
    telefono: string | null
    dni: string | null
  }>>(
    `SELECT id, nombre, email, telefono, dni FROM User WHERE id = ? LIMIT 1`,
    turnoRaw.pacienteId
  )

  const turno = {
    ...turnoRaw,
    paciente: pacienteCompleto.length > 0 ? pacienteCompleto[0] : turnoRaw.paciente,
    obraSocial: turnoExtra?.obraSocial || null,
    arancel: turnoExtra?.arancel || null,
    motivoCancelacion: turnoExtra?.motivoCancelacion || null,
    canceladoAt: turnoExtra?.canceladoAt ? new Date(turnoExtra.canceladoAt) : null,
    motivoEliminacion: turnoExtra?.motivoEliminacion || null,
    eliminadoAt: turnoExtra?.eliminadoAt ? new Date(turnoExtra.eliminadoAt) : null,
    consultorioProfesional,
    profesional: {
      ...turnoRaw.profesional!,
      especialidad: turnoRaw.profesional?.especialidad || "",
    },
  } as any

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/profesional/turnos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Detalle del Turno</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Información del Turno</CardTitle>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                turno.estado === "CONFIRMADO"
                  ? "bg-green-100 text-green-800"
                  : turno.estado === "CANCELADO"
                  ? "bg-red-100 text-red-800"
                  : turno.estado === "COMPLETADO"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {turno.estado}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <h3 className="font-semibold">Fecha y Hora</h3>
                </div>
                <p className="text-gray-700">
                  {formatDateTime(turno.fecha, turno.hora)}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <h3 className="font-semibold">Paciente</h3>
                </div>
                <p className="text-gray-700">{turno.paciente.nombre}</p>
                {turno.paciente.email && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {turno.paciente.email}
                  </p>
                )}
                {turno.paciente.telefono && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {turno.paciente.telefono}
                  </p>
                )}
                {turno.paciente.dni && (
                  <p className="text-sm text-gray-500 mt-1">
                    DNI: {turno.paciente.dni}
                  </p>
                )}
              </div>

              {turno.consultorioProfesional && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <h3 className="font-semibold">Consultorio</h3>
                  </div>
                  <p className="text-gray-700">
                    {turno.consultorioProfesional.consultorio.nombre}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {turno.consultorioProfesional.consultorio.direccion}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {turno.codigoTurno && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <h3 className="font-semibold">Código de Turno</h3>
                  </div>
                  <p className="text-gray-700 font-mono">{turno.codigoTurno}</p>
                </div>
              )}

              {turno.obraSocial && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-5 w-5 text-gray-500" />
                    <h3 className="font-semibold">Obra Social</h3>
                  </div>
                  <p className="text-gray-700">{turno.obraSocial}</p>
                </div>
              )}

              {turno.motivo && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <h3 className="font-semibold">Motivo de la Consulta</h3>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{turno.motivo}</p>
                </div>
              )}

              {turno.arancel && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <h3 className="font-semibold">Arancel</h3>
                  </div>
                  <p className="text-gray-700">${turno.arancel.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          {turno.motivoCancelacion && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h4 className="font-semibold text-red-800 mb-2">Motivo de Cancelación</h4>
              <p className="text-red-700">{turno.motivoCancelacion}</p>
              {turno.canceladoAt && (
                <p className="text-xs text-red-600 mt-2">
                  Cancelado el: {formatDate(turno.canceladoAt)}
                </p>
              )}
            </div>
          )}

          {turno.motivoEliminacion && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h4 className="font-semibold text-red-800 mb-2">⚠️ Turno Eliminado</h4>
              <p className="text-red-700">
                <strong>Causa de eliminación:</strong> {turno.motivoEliminacion}
              </p>
              {turno.eliminadoAt && (
                <p className="text-xs text-red-600 mt-2">
                  Eliminado el: {formatDate(turno.eliminadoAt)}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t">
            {turno.estado === "CONFIRMADO" && (
              <CompletarTurnoButton
                turnoId={turno.id}
                pacienteNombre={turno.paciente.nombre}
              />
            )}
            {turno.estado !== "CANCELADO" &&
              turno.estado !== "COMPLETADO" &&
              turno.estado !== "ELIMINADO" && (
                <CancelTurnoButton turnoId={turno.id} />
              )}
            <Link href={`/dashboard/profesional/historia-clinica/${turno.pacienteId}`}>
              <Button variant="outline">
                Ver Historia Clínica
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
