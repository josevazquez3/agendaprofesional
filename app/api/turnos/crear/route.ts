import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProfesionalById } from "@/lib/profesional-helpers"
import { sendEmail } from "@/lib/email"
import { sendWhatsAppMessage } from "@/lib/whatsapp"
import { generateTurnoConfirmationEmail } from "@/lib/email"
import { generateTurnoConfirmationWhatsApp } from "@/lib/whatsapp"
import { logCreate } from "@/lib/audit-service"
import { getActiveClinic } from "@/lib/clinic-context"
import { existeTurnoEnHorario } from "@/lib/turno-helpers"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { pacienteId: pacienteIdParam, profesionalId, fecha, hora, motivo, obraSocial, obraSocialId, consultorioProfesionalId } = body

    if (!profesionalId || !fecha || !hora) {
      return NextResponse.json(
        { error: `Faltan campos requeridos. profesionalId: ${profesionalId}, fecha: ${fecha}, hora: ${hora}` },
        { status: 400 }
      )
    }

    let pacienteId: string
    if (session.user.role === "SECRETARIA" || session.user.role === "ADMIN") {
      if (!pacienteIdParam) {
        return NextResponse.json(
          { error: "El pacienteId es requerido para crear turnos" },
          { status: 400 }
        )
      }
      pacienteId = pacienteIdParam
    } else if (session.user.role === "PACIENTE") {
      pacienteId = session.user.id
    } else {
      return NextResponse.json(
        { error: "No autorizado para crear turnos" },
        { status: 403 }
      )
    }

    const profesional = await getProfesionalById(profesionalId, {
      includeUser: true,
      includeUserFields: ["nombre", "email"],
    })

    if (!profesional) {
      return NextResponse.json(
        { error: "Profesional no encontrado" },
        { status: 404 }
      )
    }

    const fechaTurno = new Date(fecha)
    fechaTurno.setHours(0, 0, 0, 0)
    const fechaFin = new Date(fechaTurno)
    fechaFin.setHours(23, 59, 59, 999)

    const turnoExistente = await existeTurnoEnHorario(
      profesionalId,
      fechaTurno,
      hora,
      ["PENDIENTE", "CONFIRMADO"]
    )

    if (turnoExistente) {
      return NextResponse.json(
        { error: `Ya existe un turno en este horario (${fecha} ${hora})` },
        { status: 400 }
      )
    }

    const paciente = await prisma.user.findUnique({
      where: { id: pacienteId },
      select: { id: true, nombre: true, email: true, telefono: true },
    })

    if (!paciente) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      )
    }

    let clinicId: string | null = null
    try {
      const clinic = await getActiveClinic()
      if (clinic) {
        clinicId = clinic.id
      }
      if (!clinicId) {
        const clinicUser = await prisma.clinicUser.findFirst({
          where: { userId: session.user.id, activo: true },
          select: { clinicId: true },
        })
        if (clinicUser) clinicId = clinicUser.clinicId
      }
      if (!clinicId) {
        const primeraClinic = await prisma.clinic.findFirst({
          select: { id: true },
        })
        if (primeraClinic) clinicId = primeraClinic.id
      }
    } catch (err) {
      console.error("Error obteniendo clinicId:", err)
    }

    if (!clinicId) {
      return NextResponse.json(
        { error: "No se pudo determinar la clínica para crear el turno" },
        { status: 500 }
      )
    }

    const fechaCreacion = new Date(fecha)
    fechaCreacion.setHours(0, 0, 0, 0)

    const turno = await prisma.turno.create({
      data: {
        clinicId,
        pacienteId,
        profesionalId,
        consultorioProfesionalId: consultorioProfesionalId || null,
        fecha: fechaCreacion,
        hora,
        estado: "PENDIENTE",
        motivo: motivo || null,
        obraSocial: obraSocial || null,
        obraSocialId: obraSocialId || null,
      },
      select: {
        id: true,
        codigoTurno: true,
        pacienteId: true,
        profesionalId: true,
        fecha: true,
        hora: true,
        estado: true,
        motivo: true,
      },
    })

    const turnoResponse = {
      id: turno.id,
      codigoTurno: turno.codigoTurno,
      pacienteId: turno.pacienteId,
      profesionalId: turno.profesionalId,
      fecha: turno.fecha,
      hora: turno.hora,
      estado: turno.estado,
      motivo: turno.motivo,
      paciente: {
        id: paciente.id,
        nombre: paciente.nombre,
        email: paciente.email,
      },
      profesional: {
        id: profesional.id,
        user: profesional.user
          ? { id: profesional.userId, nombre: profesional.user.nombre || "", email: profesional.user.email || "" }
          : { id: profesional.userId, nombre: "", email: "" },
      },
    }

    const fechaFormateada = new Date(fecha).toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const nombreProfesional = profesional.user?.nombre || "Profesional"

    await Promise.allSettled([
      paciente.email
        ? sendEmail({
            to: paciente.email,
            subject: "Turno Confirmado - Agenda Profesional",
            html: generateTurnoConfirmationEmail(paciente.nombre, nombreProfesional, fechaFormateada, hora),
          })
        : Promise.resolve(),
      paciente.telefono
        ? sendWhatsAppMessage({
            to: paciente.telefono,
            message: generateTurnoConfirmationWhatsApp(
              paciente.nombre,
              nombreProfesional,
              fechaFormateada,
              hora,
              turno.codigoTurno
            ),
          })
        : Promise.resolve(),
      prisma.notificacion.createMany({
        data: [
          {
            userId: pacienteId,
            turnoId: turno.id,
            tipo: "TURNO_CONFIRMADO",
            titulo: "Turno Confirmado",
            mensaje: `Su turno con ${nombreProfesional} ha sido confirmado para el ${fechaFormateada} a las ${hora}`,
          },
          {
            userId: profesional.userId,
            turnoId: turno.id,
            tipo: "NUEVO_TURNO",
            titulo: "Nuevo Turno",
            mensaje: `Nuevo turno con ${paciente.nombre} el ${fechaFormateada} a las ${hora}`,
          },
        ],
      }),
      clinicId
        ? logCreate(
            clinicId,
            session.user.id,
            "APPOINTMENT",
            turno.id,
            {
              pacienteId: turno.pacienteId,
              profesionalId: turno.profesionalId,
              fecha: turno.fecha.toISOString(),
              hora: turno.hora,
              motivo: turno.motivo,
              estado: turno.estado,
            },
            request as any
          )
        : Promise.resolve(),
    ])

    return NextResponse.json(
      { message: "Turno creado exitosamente", turno: turnoResponse },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creando turno:", error)
    let errorMessage = "Error al crear turno"
    if (error?.message?.includes("UNIQUE") || error?.code === "P2002") {
      errorMessage = "Ya existe un turno con ese código o conflicto de horario"
    } else if (error?.message?.includes("Foreign key") || error?.code === "P2003") {
      errorMessage = "Error de referencia: verifique que el paciente, profesional o clínica existan"
    } else if (error?.message?.includes("NOT NULL") || error?.code === "P2011") {
      errorMessage = "Faltan campos requeridos"
    } else if (process.env.NODE_ENV === "development") {
      errorMessage = error?.message || errorMessage
    }
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? { message: error?.message, code: error?.code } : undefined,
      },
      { status: 500 }
    )
  }
}
