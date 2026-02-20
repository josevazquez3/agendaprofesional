import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const consultorios = await prisma.consultorio.findMany({
      include: {
        profesionales: {
          include: {
            profesional: {
              include: {
                user: {
                  select: {
                    nombre: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        nombre: "asc",
      },
    })

    return NextResponse.json(consultorios)
  } catch (error) {
    console.error("Error obteniendo consultorios:", error)
    return NextResponse.json(
      { error: "Error al obtener consultorios" },
      { status: 500 }
    )
  }
}
