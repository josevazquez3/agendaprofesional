import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTurnoById, existeTurnoEnHorario } from "@/lib/turno-helpers"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { fecha, hora, estado, motivo, obraSocial } = body

    // Obtener turno usando helper
    const turno = await getTurnoById(params.id)

    if (!turno) {
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 }
      )
    }

    // Verificar permisos
    if (
      session.user.role === "PACIENTE" &&
      turno.pacienteId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "No tiene permisos para editar este turno" },
        { status: 403 }
      )
    }

    if (session.user.role === "PROFESIONAL") {
      // Obtener profesional del usuario
      const profesional = await prisma.$queryRawUnsafe<Array<{
        id: string
        userId: string
      }>>(
        `SELECT id, userId FROM Profesional WHERE userId = ? LIMIT 1`,
        session.user.id
      )
      if (
        profesional.length === 0 ||
        turno.profesionalId !== profesional[0].id
      ) {
        // Si el profesional no es el dueño del turno, solo SECRETARIA y ADMIN pueden editarlo
        if (session.user.role !== "SECRETARIA" && session.user.role !== "ADMIN") {
          return NextResponse.json(
            { error: "No tiene permisos para editar este turno" },
            { status: 403 }
          )
        }
      }
    }

    // Verificar que no haya conflicto de horario si se cambia fecha/hora
    if (fecha && hora) {
      const turnoExistente = await existeTurnoEnHorario(
        turno.profesionalId,
        new Date(fecha),
        hora,
        ["PENDIENTE", "CONFIRMADO"],
        params.id
      )

      if (turnoExistente) {
        return NextResponse.json(
          { error: "Ya existe un turno en este horario" },
          { status: 400 }
        )
      }
    }

    // Actualizar turno
    const turnoActualizado = await prisma.turno.update({
      where: { id: params.id },
      data: {
        fecha: fecha ? new Date(fecha) : turno.fecha,
        hora: hora || turno.hora,
        estado: estado || turno.estado,
        motivo: motivo !== undefined ? motivo : turno.motivo,
        obraSocial: obraSocial !== undefined ? obraSocial : turno.obraSocial,
      },
      include: {
        paciente: true,
        profesional: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: "Turno actualizado exitosamente",
      turno: turnoActualizado,
    })
  } catch (error: any) {
    console.error("Error actualizando turno:", error)
    return NextResponse.json(
      { error: "Error al actualizar turno" },
      { status: 500 }
    )
  }
}
