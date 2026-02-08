import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const consultorio = await prisma.consultorio.findUnique({
      where: { id: params.id },
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
    })

    if (!consultorio) {
      return NextResponse.json(
        { error: "Consultorio no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(consultorio)
  } catch (error) {
    console.error("Error obteniendo consultorio:", error)
    return NextResponse.json(
      { error: "Error al obtener consultorio" },
      { status: 500 }
    )
  }
}
