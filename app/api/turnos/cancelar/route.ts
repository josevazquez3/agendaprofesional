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

    if (!turnoId) {
      return NextResponse.json(
        { error: "ID de turno requerido" },
        { status: 400 }
      )
    }

    // Obtener turno usando helper
    const turno = await getTurnoById(turnoId)

    if (!turno) {
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 }
      )
    }

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

    const turnoCancelado = await prisma.turno.update({
      where: { id: turnoId },
      data: {
        estado: "CANCELADO",
        canceladoAt: ahora,
        motivoCancelacion,
      },
      select: { id: true, estado: true, canceladoAt: true, motivoCancelacion: true },
    })

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

    const pacienteUser = await prisma.user.findUnique({
      where: { id: turno.pacienteId },
      select: { telefono: true },
    })
    const telefonoPaciente = pacienteUser?.telefono ?? null
    
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

    const secretariasYAdmin = await prisma.user.findMany({
      where: { role: { in: ["SECRETARIA", "ADMIN"] } },
      select: { id: true, nombre: true, email: true, role: true },
    })

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
