import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTurnoById } from "@/lib/turno-helpers"
import { sendEmail } from "@/lib/email"
import { sendWhatsAppMessage } from "@/lib/whatsapp"
import { generateTurnoCancellationEmail, generateTurnoCancellationWhatsApp } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const turnoId = formData.get("turnoId") as string
    const motivoCancelacion = formData.get("motivoCancelacion") as string || "Cancelado por el usuario"

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

    // Actualizar turno
    const turnoCancelado = await prisma.turno.update({
      where: { id: turnoId },
      data: {
        estado: "CANCELADO",
        canceladoAt: new Date(),
        motivoCancelacion,
      },
    })

    const fechaFormateada = new Date(turno.fecha).toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Enviar notificaciones
    // Email al paciente
    if (turno.paciente.email) {
      const emailHtml = generateTurnoCancellationEmail(
        turno.paciente.nombre,
        turno.profesional.user.nombre,
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

    // WhatsApp al paciente
    if (turno.paciente.telefono) {
      const whatsappMessage = generateTurnoCancellationWhatsApp(
        turno.paciente.nombre,
        turno.profesional.user.nombre,
        fechaFormateada,
        turno.hora
      )
      await sendWhatsAppMessage({
        to: turno.paciente.telefono,
        message: whatsappMessage,
      })
    }

    // Email al profesional
    if (turno.profesional.user.email) {
      await sendEmail({
        to: turno.profesional.user.email,
        subject: "Turno Cancelado",
        html: `El turno con ${turno.paciente.nombre} del ${fechaFormateada} a las ${turno.hora} ha sido cancelado.`,
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
    })

    // Crear notificaciones in-app
    const notificaciones = [
      {
        userId: turno.pacienteId,
        turnoId: turno.id,
        tipo: "TURNO_CANCELADO",
        titulo: "Turno Cancelado",
        mensaje: `Su turno con ${turno.profesional.user.nombre} ha sido cancelado.`,
      },
      {
        userId: turno.profesional.userId,
        turnoId: turno.id,
        tipo: "TURNO_CANCELADO",
        titulo: "Turno Cancelado",
        mensaje: `El turno con ${turno.paciente.nombre} ha sido cancelado.`,
      },
      ...secretariasYAdmin.map((user) => ({
        userId: user.id,
        turnoId: turno.id,
        tipo: "TURNO_CANCELADO",
        titulo: "Turno Cancelado",
        mensaje: `El turno de ${turno.paciente.nombre} con ${turno.profesional.user.nombre} ha sido cancelado.`,
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
          html: `El turno de ${turno.paciente.nombre} con ${turno.profesional.user.nombre} del ${fechaFormateada} a las ${turno.hora} ha sido cancelado.`,
        })
      }
    }

    return NextResponse.json({
      message: "Turno cancelado exitosamente",
      turno: turnoCancelado,
    })
  } catch (error: any) {
    console.error("Error cancelando turno:", error)
    return NextResponse.json(
      { error: "Error al cancelar turno" },
      { status: 500 }
    )
  }
}
