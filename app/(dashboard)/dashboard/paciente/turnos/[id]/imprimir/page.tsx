import { getServerSession } from "next-auth"
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
    // Redirigir según el rol
    if (session.user.role === "PACIENTE") {
      redirect("/dashboard/paciente/turnos")
    } else if (session.user.role === "PROFESIONAL") {
      redirect("/dashboard/profesional/turnos")
    } else if (session.user.role === "SECRETARIA") {
      redirect("/dashboard/secretaria/turnos")
    } else {
      redirect("/dashboard/admin/turnos")
    }
  }

  // Verificar permisos según el rol
  if (session.user.role === "PACIENTE") {
    // Paciente solo puede imprimir sus propios turnos
    if (turnoRaw.pacienteId !== session.user.id) {
      redirect("/dashboard/paciente/turnos")
    }
  } else if (session.user.role === "PROFESIONAL") {
    // Profesional solo puede imprimir turnos de sus pacientes
    const profesionalRaw = await prisma.$queryRawUnsafe<Array<{
      id: string
      userId: string
    }>>(
      `SELECT id, userId FROM Profesional WHERE userId = ? LIMIT 1`,
      session.user.id
    )
    if (profesionalRaw.length === 0 || turnoRaw.profesionalId !== profesionalRaw[0].id) {
      redirect("/dashboard/profesional/turnos")
    }
  }
  // ADMIN y SECRETARIA pueden imprimir cualquier turno

  // Obtener información adicional del turno y consultorio
  const turnoCompleto = await prisma.$queryRawUnsafe<Array<{
    id: string
    obraSocial: string | null
    arancel: number | null
  }>>(`SELECT id, obraSocial, arancel FROM Turno WHERE id = ? LIMIT 1`, id)

  const turnoExtra = turnoCompleto.length > 0 ? turnoCompleto[0] : null

  // Obtener consultorio si existe (primero del turno, luego del profesional)
  let consultorioProfesional = null
  
  // Intentar obtener el consultorio del turno primero
  if (turnoRaw.consultorioProfesionalId) {
    const consultorioTurnoData = await prisma.$queryRawUnsafe<Array<{
      consultorioId: string
      consultorioNombre: string
      consultorioDireccion: string | null
    }>>(
      `SELECT cp.consultorioId, c.nombre as consultorioNombre, c.direccion as consultorioDireccion
       FROM ConsultorioProfesional cp
       JOIN Consultorio c ON cp.consultorioId = c.id
       WHERE cp.id = ? LIMIT 1`,
      turnoRaw.consultorioProfesionalId
    )
    
    if (consultorioTurnoData.length > 0) {
      consultorioProfesional = {
        consultorio: {
          nombre: consultorioTurnoData[0].consultorioNombre,
          direccion: consultorioTurnoData[0].consultorioDireccion,
        },
      }
    }
  }
  
  // Si no hay consultorio en el turno, buscar el primero del profesional
  if (!consultorioProfesional) {
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

  // Generar QR code con información del turno
  // Primero intentar con datos completos, luego con solo el código si falla
  let qrCodeDataUrl = ""
  
  try {
    // Validar que tenemos los datos necesarios
    if (!turno.codigoTurno) {
      throw new Error("No se encontró código de turno")
    }

    // Intentar generar QR con datos completos
    const qrData = JSON.stringify({
      codigoTurno: turno.codigoTurno,
      paciente: turno.paciente?.nombre || "",
      profesional: turno.profesional?.user?.nombre || "",
      fecha: turno.fecha ? turno.fecha.toISOString() : "",
      hora: turno.hora || "",
      id: turno.id,
    })
    
    qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256
    })
  } catch (error: any) {
    console.error("Error generando QR con datos completos:", error)
    // Intentar generar un QR más simple con solo el código de turno
    try {
      if (turno.codigoTurno) {
        qrCodeDataUrl = await QRCode.toDataURL(turno.codigoTurno, {
          errorCorrectionLevel: 'M',
          width: 256,
          margin: 1,
        })
      } else {
        throw new Error("No hay código de turno disponible")
      }
    } catch (fallbackError: any) {
      console.error("Error en fallback de QR:", fallbackError)
      // Si todo falla, intentar con el ID del turno
      try {
        if (turno.id) {
          qrCodeDataUrl = await QRCode.toDataURL(turno.id, {
            errorCorrectionLevel: 'L',
            width: 200,
          })
        }
      } catch (finalError: any) {
        console.error("Error final generando QR:", finalError)
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 shadow-lg print:shadow-none">
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
            <strong>Profesional:</strong> {turno.profesional?.user?.nombre || "Profesional no disponible"}
          </p>
          <p className="text-gray-700">
            <strong>Especialidad:</strong> {turno.profesional?.especialidad || "N/A"}
          </p>
          <p className="text-gray-700">
            <strong>Fecha:</strong> {formatDate(turno.fecha)}
          </p>
          <p className="text-gray-700">
            <strong>Hora:</strong> {turno.hora}
          </p>
          {turno.consultorioProfesional && (
            <>
              <p className="text-gray-700">
                <strong>Consultorio:</strong> {turno.consultorioProfesional.consultorio.nombre}
              </p>
              {turno.consultorioProfesional.consultorio.direccion && (
                <p className="text-gray-700">
                  <strong>Dirección:</strong> {turno.consultorioProfesional.consultorio.direccion}
                </p>
              )}
            </>
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

      {qrCodeDataUrl ? (
        <div className="text-center border-t pt-6">
          <div className="mb-4 flex justify-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-300 inline-block">
              <img 
                src={qrCodeDataUrl} 
                alt="QR Code del Turno" 
                className="mx-auto w-48 h-48"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-800 mb-2">
            Código QR del Turno
          </p>
          <p className="text-xs text-gray-600 mb-1">
            Presente este código QR al llegar al consultorio
          </p>
          <p className="text-xs text-gray-500">
            Código: {turno.codigoTurno}
          </p>
        </div>
      ) : (
        <div className="text-center border-t pt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ No se pudo generar el código QR. Código de turno: {turno.codigoTurno}
            </p>
          </div>
        </div>
      )}

      <div className="text-center mt-6 no-print">
        <ClientPrintButton />
      </div>
    </div>
  )
}
