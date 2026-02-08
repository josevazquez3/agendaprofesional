import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { cancelSubscription } from "@/lib/subscription"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/platform/subscriptions/:id/cancel
 * Cancelar suscripción (solo PLATFORM_OWNER)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "PLATFORM_OWNER") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    // Obtener suscripción para obtener clinicId
    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "Suscripción no encontrada" },
        { status: 404 }
      )
    }

    await cancelSubscription(subscription.clinicId)

    return NextResponse.json({ 
      message: "Suscripción cancelada exitosamente" 
    })
  } catch (error) {
    console.error("Error cancelando suscripción:", error)
    return NextResponse.json(
      { error: "Error al cancelar suscripción" },
      { status: 500 }
    )
  }
}
