import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const profesionales = await prisma.profesional.findMany({
      include: {
        user: {
          select: { id: true, nombre: true, email: true, telefono: true },
        },
        horarios: {
          where: { activo: true },
        },
        aranceles: {
          where: { activo: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(profesionales)
  } catch (error) {
    console.error("Error obteniendo profesionales:", error)
    return NextResponse.json(
      { error: "Error al obtener profesionales" },
      { status: 500 }
    )
  }
}
