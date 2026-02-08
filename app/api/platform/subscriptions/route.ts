import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/platform/subscriptions
 * Listar todas las suscripciones (solo PLATFORM_OWNER)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "PLATFORM_OWNER") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const clinicId = searchParams.get("clinicId")
    const status = searchParams.get("status")

    const where: any = {}
    if (clinicId) where.clinicId = clinicId
    if (status) where.status = status

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        clinic: {
          select: {
            id: true,
            nombre: true,
            slug: true,
          },
        },
        plan: {
          select: {
            id: true,
            nombre: true,
            precioMensual: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error("Error obteniendo suscripciones:", error)
    return NextResponse.json(
      { error: "Error al obtener suscripciones" },
      { status: 500 }
    )
  }
}
