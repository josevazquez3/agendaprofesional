import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProfesionalByUserId } from "@/lib/profesional-helpers"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const profesionalIdParam = searchParams.get("profesionalId")

    let profesionalId: string

    // Si es secretaria o admin, puede especificar profesionalId
    if (
      (session.user.role === "SECRETARIA" || session.user.role === "ADMIN") &&
      profesionalIdParam
    ) {
      profesionalId = profesionalIdParam
    } else {
      // Si es profesional, solo puede ver sus propios horarios
      const profesional = await getProfesionalByUserId(session.user.id)

      if (!profesional) {
        return NextResponse.json(
          { error: "Profesional no encontrado" },
          { status: 404 }
        )
      }

      profesionalId = profesional.id
    }

    const horarios = await prisma.horarioDisponible.findMany({
      where: {
        profesionalId,
      },
      orderBy: [
        { diaSemana: "asc" },
        { horaInicio: "asc" },
      ],
    })

    return NextResponse.json(horarios)
  } catch (error) {
    console.error("Error obteniendo horarios:", error)
    return NextResponse.json(
      { error: "Error al obtener horarios" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { diaSemana, horaInicio, horaFin, duracionTurno, profesionalId: profesionalIdParam } = body

    let profesionalId: string

    // Si es secretaria o admin, puede especificar profesionalId
    if (
      (session.user.role === "SECRETARIA" || session.user.role === "ADMIN") &&
      profesionalIdParam
    ) {
      profesionalId = profesionalIdParam
    } else {
      // Si es profesional, solo puede crear sus propios horarios
      const profesional = await getProfesionalByUserId(session.user.id)

      if (!profesional) {
        return NextResponse.json(
          { error: "Profesional no encontrado" },
          { status: 404 }
        )
      }

      profesionalId = profesional.id
    }

    // Verificar si ya existe un horario para ese día
    const horarioExistente = await prisma.horarioDisponible.findFirst({
      where: {
        profesionalId,
        diaSemana,
      },
    })

    if (horarioExistente) {
      return NextResponse.json(
        { error: "Ya existe un horario para este día" },
        { status: 400 }
      )
    }

    const horario = await prisma.horarioDisponible.create({
      data: {
        profesionalId,
        diaSemana,
        horaInicio,
        horaFin,
        duracionTurno: duracionTurno || 30,
      },
    })

    return NextResponse.json(horario, { status: 201 })
  } catch (error) {
    console.error("Error creando horario:", error)
    return NextResponse.json(
      { error: "Error al crear horario" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, activo } = body

    const horario = await prisma.horarioDisponible.update({
      where: { id },
      data: { activo },
    })

    return NextResponse.json(horario)
  } catch (error) {
    console.error("Error actualizando horario:", error)
    return NextResponse.json(
      { error: "Error al actualizar horario" },
      { status: 500 }
    )
  }
}
