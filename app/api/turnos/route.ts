import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTurnos } from "@/lib/turno-helpers"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const profesionalId = searchParams.get("profesionalId")
    const fechaInicio = searchParams.get("fechaInicio")
    const fechaFin = searchParams.get("fechaFin")

    const where: any = {}

    if (profesionalId) {
      where.profesionalId = profesionalId
    }

    if (fechaInicio && fechaFin) {
      where.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      }
    }

    // Si es paciente, solo puede ver sus propios turnos
    if (session.user.role === "PACIENTE") {
      where.pacienteId = session.user.id
    }

    // Si es profesional, solo puede ver sus propios turnos
    let profesionalIdFilter: string | undefined = undefined
    if (session.user.role === "PROFESIONAL") {
      const profesional = await prisma.$queryRawUnsafe<Array<{
        id: string
        userId: string
      }>>(
        `SELECT id, userId FROM Profesional WHERE userId = ? LIMIT 1`,
        session.user.id
      )
      if (profesional.length > 0) {
        profesionalIdFilter = profesional[0].id
      }
    }

    // Construir filtros de fecha
    const fechaFilter =
      fechaInicio && fechaFin
        ? {
            gte: new Date(fechaInicio),
            lte: new Date(fechaFin),
          }
        : undefined

    const turnos = await getTurnos({
      profesionalId: profesionalIdFilter || profesionalId || undefined,
      pacienteId: session.user.role === "PACIENTE" ? session.user.id : undefined,
      fecha: fechaFilter,
      orderBy: { fecha: "asc" },
    })

    // Nota: consultorioProfesional no está incluido en getTurnos
    // Si se necesita, se puede agregar después o modificar el helper

    return NextResponse.json({ turnos })
  } catch (error) {
    console.error("Error obteniendo turnos:", error)
    return NextResponse.json(
      { error: "Error al obtener turnos" },
      { status: 500 }
    )
  }
}
