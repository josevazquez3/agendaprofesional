import { getServerSession } from "next/auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTurnoById } from "@/lib/turno-helpers"
import { formatDate, formatDateTime } from "@/lib/utils"
import QRCode from "qrcode"
import { ClientPrintButton } from "./ClientPrintButton"

export default async function ImprimirTurnoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Obtener turno usando helper
  const turnoRaw = await getTurnoById(id)

  if (!turnoRaw) {
    redirect("/dashboard/paciente/turnos")
  }

  // Verificar que el paciente solo pueda imprimir sus propios turnos
  if (
    session.user.role === "PACIENTE" &&
    turnoRaw.pacienteId !== session.user.id
  ) {
    redirect("/dashboard/paciente/turnos")
  }

  // Obtener información adicional del turno y consultorio
  const turnoCompleto = await prisma.$queryRawUnsafe<Array<{
    id: string
    obraSocial: string | null
    arancel: number | null
  }>>(`SELECT id, obraSocial, arancel FROM Turno WHERE id = ? LIMIT 1`, id)

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
    dni: string | null
  }>>(
    `SELECT id, nombre, email, dni FROM User WHERE id = ? LIMIT 1`,
    turnoRaw.pacienteId
  )

  const turno = {
    ...turnoRaw,
    paciente: pacienteCompleto.length > 0 ? pacienteCompleto[0] : turnoRaw.paciente,
    obraSocial: turnoExtra?.obraSocial || null,
    arancel: turnoExtra?.arancel || null,
    consultorioProfesional,
    profesional: {
      ...turnoRaw.profesional!,
      especialidad: turnoRaw.profesional?.especialidad || "",
    },
  } as any

  // Generar QR code
  const qrData = JSON.stringify({
    codigoTurno: turno.codigoTurno,
    paciente: turno.paciente.nombre,
    profesional: turno.profesional.user.nombre,
    fecha: turno.fecha.toISOString(),
    hora: turno.hora,
  })

  let qrCodeDataUrl = ""
  try {
    qrCodeDataUrl = await QRCode.toDataURL(qrData)
  } catch (error) {
    console.error("Error generando QR:", error)
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Comprobante de Turno</h1>
        <p className="text-gray-600">Agenda Profesional</p>
      </div>

      <div className="space-y-6 border-b pb-6 mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Datos del Paciente</h2>
          <p className="text-gray-700">
            <strong>Nombre:</strong> {turno.paciente.nombre}
          </p>
          {turno.paciente.dni && (
            <p className="text-gray-700">
              <strong>DNI:</strong> {turno.paciente.dni}
            </p>
          )}
          {turno.obraSocial ? (
            <p className="text-gray-700">
              <strong>Obra Social:</strong> {turno.obraSocial}
            </p>
          ) : (
            <p className="text-gray-700">
              <strong>Atención:</strong> Sin obra social
            </p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Datos del Turno</h2>
          <p className="text-gray-700">
            <strong>Profesional:</strong> {turno.profesional.user.nombre}
          </p>
          <p className="text-gray-700">
            <strong>Especialidad:</strong> {turno.profesional.especialidad}
          </p>
          <p className="text-gray-700">
            <strong>Fecha:</strong> {formatDate(turno.fecha)}
          </p>
          <p className="text-gray-700">
            <strong>Hora:</strong> {turno.hora}
          </p>
          {turno.consultorioProfesional && (
            <p className="text-gray-700">
              <strong>Consultorio:</strong>{" "}
              {turno.consultorioProfesional.consultorio.direccion}
            </p>
          )}
          {turno.arancel && (
            <p className="text-gray-700">
              <strong>Arancel:</strong> ${turno.arancel}
            </p>
          )}
          <p className="text-gray-700">
            <strong>Código de Turno:</strong> {turno.codigoTurno}
          </p>
        </div>
      </div>

      {qrCodeDataUrl && (
        <div className="text-center">
          <div className="mb-4">
            <img src={qrCodeDataUrl} alt="QR Code" className="mx-auto" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Presente este código QR al llegar al consultorio
          </p>
        </div>
      )}

      <div className="text-center mt-6 print:hidden">
        <ClientPrintButton />
      </div>
    </div>
  )
}
