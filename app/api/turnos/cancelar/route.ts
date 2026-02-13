import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTurnoById } from "@/lib/turno-helpers"
import { sendEmail, generateTurnoCancellationEmail } from "@/lib/email"
import { sendWhatsAppMessage, generateTurnoCancellationWhatsApp } from "@/lib/whatsapp"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json().catch(() => {
      // Fallback para FormData si viene de algún lugar antiguo
      return {}
    })
    const turnoId = body.turnoId || (await request.formData()).get("turnoId") as string
    const motivoCancelacion = body.motivoCancelacion || "Cancelado por el usuario"
    
    console.log("Cancelando turno:", turnoId, "Motivo:", motivoCancelacion)

    if (!turnoId) {
      return NextResponse.json(
        { error: "ID de turno requerido" },
        { status: 400 }
      )
    }

    console.log("Obteniendo turno con ID:", turnoId)
    
    // Obtener turno usando helper
    const turno = await getTurnoById(turnoId)

    if (!turno) {
      console.error("Turno no encontrado:", turnoId)
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 }
      )
    }
    
    console.log("Turno encontrado:", {
      id: turno.id,
      estado: turno.estado,
      pacienteId: turno.pacienteId,
      profesionalId: turno.profesionalId,
    })

    // Verificar permisos (paciente solo puede cancelar sus propios turnos)
    if (session.user.role === "PACIENTE" && turno.pacienteId !== session.user.id) {
      return NextResponse.json(
        { error: "No tiene permisos para cancelar este turno" },
        { status: 403 }
      )
    }

    // Actualizar turno usando SQL raw para evitar problemas con schema
    const ahora = new Date()
    const ahoraISO = ahora.toISOString()
    
    console.log("Actualizando turno en base de datos...")
    try {
      // Actualizar turno usando SQL raw
      const result = await prisma.$executeRawUnsafe(
        `UPDATE Turno 
         SET estado = ?, canceladoAt = ?, motivoCancelacion = ?, updatedAt = ?
         WHERE id = ?`,
        "CANCELADO",
        ahoraISO,
        motivoCancelacion,
        ahoraISO,
        turnoId
      )
      console.log("Turno actualizado exitosamente. Filas afectadas:", result)
    } catch (error: any) {
      console.error("Error en UPDATE de turno:", error)
      console.error("Detalles:", {
        message: error.message,
        code: error.code,
        meta: error.meta,
      })
      throw new Error(`Error al actualizar turno: ${error.message || String(error)}`)
    }
    
    // Obtener el turno actualizado
    const turnoCanceladoRaw = await prisma.$queryRawUnsafe<Array<{
      id: string
      estado: string
      canceladoAt: string | null
      motivoCancelacion: string | null
    }>>(
      `SELECT id, estado, canceladoAt, motivoCancelacion FROM Turno WHERE id = ? LIMIT 1`,
      turnoId
    )
    
    const turnoCancelado = turnoCanceladoRaw.length > 0 ? {
      id: turnoCanceladoRaw[0].id,
      estado: turnoCanceladoRaw[0].estado,
      canceladoAt: turnoCanceladoRaw[0].canceladoAt ? new Date(turnoCanceladoRaw[0].canceladoAt) : null,
      motivoCancelacion: turnoCanceladoRaw[0].motivoCancelacion,
    } : null

    const fechaFormateada = new Date(turno.fecha).toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Enviar notificaciones
    // Email al paciente
    if (turno.paciente?.email) {
      const emailHtml = generateTurnoCancellationEmail(
        turno.paciente?.nombre || "Paciente",
        turno.profesional?.user?.nombre || "Profesional",
        fechaFormateada,
        turno.hora,
        motivoCancelacion
      )
      await sendEmail({
        to: turno.paciente.email,
        subject: "Turno Cancelado - Agenda Profesional",
        html: emailHtml,
      })
    }

    // WhatsApp al paciente (obtener teléfono desde la base de datos)
    const pacienteRaw = await prisma.$queryRawUnsafe<Array<{
      telefono: string | null
    }>>(
      `SELECT telefono FROM User WHERE id = ? LIMIT 1`,
      turno.pacienteId
    )
    const telefonoPaciente = pacienteRaw.length > 0 ? pacienteRaw[0].telefono : null
    
    if (telefonoPaciente) {
      const whatsappMessage = generateTurnoCancellationWhatsApp(
        turno.paciente?.nombre || "Paciente",
        turno.profesional?.user?.nombre || "Profesional",
        fechaFormateada,
        turno.hora
      )
      await sendWhatsAppMessage({
        to: telefonoPaciente,
        message: whatsappMessage,
      })
    }

    // Email al profesional
    if (turno.profesional?.user?.email) {
      await sendEmail({
        to: turno.profesional.user.email,
        subject: "Turno Cancelado",
        html: `El turno con ${turno.paciente?.nombre || "paciente"} del ${fechaFormateada} a las ${turno.hora} ha sido cancelado.`,
      })
    }

    // Obtener secretarias y admin para notificar usando SQL raw
    const secretariasYAdminRaw = await prisma.$queryRawUnsafe<Array<{
      id: string
      nombre: string
      email: string
      role: string
    }>>(
      `SELECT id, nombre, email, role FROM User WHERE role IN ('SECRETARIA', 'ADMIN')`
    )

    const secretariasYAdmin = secretariasYAdminRaw.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      role: u.role,
    }))

    // Crear notificaciones in-app
    const notificaciones = [
      {
        userId: turno.pacienteId,
        turnoId: turno.id,
        tipo: "TURNO_CANCELADO",
        titulo: "Turno Cancelado",
        mensaje: `Su turno con ${turno.profesional?.user?.nombre || "profesional"} ha sido cancelado.`,
      },
      {
        userId: turno.profesional?.user?.id || turno.profesionalId,
        turnoId: turno.id,
        tipo: "TURNO_CANCELADO",
        titulo: "Turno Cancelado",
        mensaje: `El turno con ${turno.paciente?.nombre || "paciente"} ha sido cancelado.`,
      },
      ...secretariasYAdmin.map((user) => ({
        userId: user.id,
        turnoId: turno.id,
        tipo: "TURNO_CANCELADO",
        titulo: "Turno Cancelado",
        mensaje: `El turno de ${turno.paciente?.nombre || "paciente"} con ${turno.profesional?.user?.nombre || "profesional"} ha sido cancelado.`,
      })),
    ]

    await prisma.notificacion.createMany({
      data: notificaciones,
    })

    // Enviar emails a secretarias y admin
    for (const user of secretariasYAdmin) {
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: "Turno Cancelado",
          html: `El turno de ${turno.paciente?.nombre || "paciente"} con ${turno.profesional?.user?.nombre || "profesional"} del ${fechaFormateada} a las ${turno.hora} ha sido cancelado.`,
        })
      }
    }

    return NextResponse.json({
      message: "Turno cancelado exitosamente",
      turno: turnoCancelado,
    })
  } catch (error: any) {
    console.error("Error cancelando turno:", error)
    console.error("Detalles del error:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    })
    return NextResponse.json(
      { 
        error: "Error al cancelar turno",
        details: error.message || String(error)
      },
      { status: 500 }
    )
  }
}
