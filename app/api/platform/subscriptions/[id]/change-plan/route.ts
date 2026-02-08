import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { updateSubscriptionPlan } from "@/lib/subscription"
import { changePlanSchema } from "@/lib/validations/billing"
import { z } from "zod"

/**
 * PATCH /api/platform/subscriptions/:id/change-plan
 * Cambiar plan de suscripción (solo PLATFORM_OWNER)
 */
export async function PATCH(
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

    const body = await request.json()
    const { planId } = changePlanSchema.parse(body)

    // Obtener suscripción para obtener clinicId
    const { prisma } = await import("@/lib/prisma")
    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "Suscripción no encontrada" },
        { status: 404 }
      )
    }

    const updatedSubscription = await updateSubscriptionPlan(
      subscription.clinicId,
      planId
    )

    return NextResponse.json({ subscription: updatedSubscription })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error cambiando plan:", error)
    return NextResponse.json(
      { error: "Error al cambiar plan" },
      { status: 500 }
    )
  }
}
