import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    const { consultorioId, profesionalId } = body

    if (!consultorioId || !profesionalId) {
      return NextResponse.json(
        { error: "consultorioId y profesionalId son requeridos" },
        { status: 400 }
      )
    }

    // Verificar que no esté ya asociado
    const existente = await prisma.consultorioProfesional.findUnique({
      where: {
        consultorioId_profesionalId: {
          consultorioId,
          profesionalId,
        },
      },
    })

    if (existente) {
      return NextResponse.json(
        { error: "El profesional ya está asociado a este consultorio" },
        { status: 400 }
      )
    }

    // Asociar profesional al consultorio
    const asociacion = await prisma.consultorioProfesional.create({
      data: {
        consultorioId,
        profesionalId,
      },
    })

    return NextResponse.json({
      message: "Profesional asociado exitosamente",
      asociacion,
    })
  } catch (error: any) {
    console.error("Error asociando profesional:", error)
    return NextResponse.json(
      { error: "Error al asociar profesional" },
      { status: 500 }
    )
  }
}
