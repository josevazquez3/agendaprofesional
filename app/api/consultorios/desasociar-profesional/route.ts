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

    // Desasociar profesional del consultorio
    await prisma.consultorioProfesional.delete({
      where: {
        consultorioId_profesionalId: {
          consultorioId,
          profesionalId,
        },
      },
    })

    return NextResponse.json({
      message: "Profesional desasociado exitosamente",
    })
  } catch (error: any) {
    console.error("Error desasociando profesional:", error)
    return NextResponse.json(
      { error: "Error al desasociar profesional" },
      { status: 500 }
    )
  }
}
