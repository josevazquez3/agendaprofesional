import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProfesionalByUserId } from "@/lib/profesional-helpers"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "PROFESIONAL") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const profesional = await getProfesionalByUserId(session.user.id)

    if (!profesional) {
      return NextResponse.json(
        { error: "Profesional no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: profesional.id,
      especialidad: profesional.especialidad,
    })
  } catch (error) {
    console.error("Error obteniendo profesional:", error)
    return NextResponse.json(
      { error: "Error al obtener profesional" },
      { status: 500 }
    )
  }
}
