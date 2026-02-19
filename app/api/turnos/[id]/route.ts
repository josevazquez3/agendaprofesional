import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTurnoById } from "@/lib/turno-helpers"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const turno = await getTurnoById(params.id)

    if (!turno) {
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 }
      )
    }

    // Verificar permisos
    if (session.user.role === "PACIENTE" && turno.pacienteId !== session.user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    if (session.user.role === "PROFESIONAL") {
      const prof = await prisma.profesional.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
      if (!prof || turno.profesionalId !== prof.id) {
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(turno)
  } catch (error) {
    console.error("Error obteniendo turno:", error)
    return NextResponse.json(
      { error: "Error al obtener turno" },
      { status: 500 }
    )
  }
}
