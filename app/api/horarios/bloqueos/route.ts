import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const profesionalId = searchParams.get("profesionalId")

    if (!profesionalId) {
      return NextResponse.json(
        { error: "profesionalId es requerido" },
        { status: 400 }
      )
    }

    // Obtener horarios del profesional
    const horarios = await prisma.horarioDisponible.findMany({
      where: {
        profesionalId,
      },
    })

    const horarioIds = horarios.map((h) => h.id)

    // Obtener bloqueos
    const bloqueos = await prisma.bloqueoHorario.findMany({
      where: {
        horarioDisponibleId: {
          in: horarioIds,
        },
      },
      include: {
        horarioDisponible: true,
      },
      orderBy: {
        fecha: "desc",
      },
    })

    return NextResponse.json(bloqueos)
  } catch (error) {
    console.error("Error obteniendo bloqueos:", error)
    return NextResponse.json(
      { error: "Error al obtener bloqueos" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (
      !session ||
      (session.user.role !== "SECRETARIA" && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { profesionalId, diaSemana, fecha, horaInicio, horaFin, motivo } = body

    if (!profesionalId || !diaSemana || !fecha || !horaInicio || !horaFin) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Obtener el horario disponible para ese día
    const horarioDisponible = await prisma.horarioDisponible.findFirst({
      where: {
        profesionalId,
        diaSemana,
      },
    })

    if (!horarioDisponible) {
      return NextResponse.json(
        { error: "No existe un horario configurado para este día" },
        { status: 400 }
      )
    }

    // Crear bloqueo
    const bloqueo = await prisma.bloqueoHorario.create({
      data: {
        horarioDisponibleId: horarioDisponible.id,
        fecha: new Date(fecha),
        horaInicio,
        horaFin,
        motivo: motivo || null,
      },
    })

    return NextResponse.json({
      message: "Día bloqueado exitosamente",
      bloqueo,
    })
  } catch (error: any) {
    console.error("Error creando bloqueo:", error)
    return NextResponse.json(
      { error: "Error al crear bloqueo" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (
      !session ||
      (session.user.role !== "SECRETARIA" && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { bloqueoId } = body

    if (!bloqueoId) {
      return NextResponse.json(
        { error: "bloqueoId es requerido" },
        { status: 400 }
      )
    }

    await prisma.bloqueoHorario.delete({
      where: { id: bloqueoId },
    })

    return NextResponse.json({
      message: "Bloqueo eliminado exitosamente",
    })
  } catch (error: any) {
    console.error("Error eliminando bloqueo:", error)
    return NextResponse.json(
      { error: "Error al eliminar bloqueo" },
      { status: 500 }
    )
  }
}
