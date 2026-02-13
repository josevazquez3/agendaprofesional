import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPlanSchema, updatePlanSchema } from "@/lib/validations/billing"
import { z } from "zod"

/**
 * GET /api/platform/plans
 * Listar todos los planes (solo PLATFORM_OWNER)
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

    const plans = await prisma.plan.findMany({
      orderBy: {
        precioMensual: "asc",
      },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Error obteniendo planes:", error)
    return NextResponse.json(
      { error: "Error al obtener planes" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/platform/plans
 * Crear nuevo plan (solo PLATFORM_OWNER)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "PLATFORM_OWNER") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createPlanSchema.parse(body)

    const plan = await prisma.plan.create({
      data: validatedData,
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creando plan:", error)
    return NextResponse.json(
      { error: "Error al crear plan" },
      { status: 500 }
    )
  }
}
