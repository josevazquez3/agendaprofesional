import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updatePlanSchema } from "@/lib/validations/billing"
import { z } from "zod"

/**
 * PATCH /api/platform/plans/:id
 * Actualizar plan (solo PLATFORM_OWNER)
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
    const validatedData = updatePlanSchema.parse(body)

    const plan = await prisma.plan.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json({ plan })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      )
    }

    console.error("Error actualizando plan:", error)
    return NextResponse.json(
      { error: "Error al actualizar plan" },
      { status: 500 }
    )
  }
}
