import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveClinic } from "@/lib/clinic-context"
import { auditFilterSchema } from "@/lib/validations/audit"
import { z } from "zod"

/**
 * GET /api/admin/audit
 * Listar logs de auditoría (solo ADMIN/OWNER)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Solo ADMIN y OWNER pueden ver auditorías
    if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      return NextResponse.json(
        { error: "No autorizado. Solo ADMIN y OWNER pueden ver auditorías." },
        { status: 403 }
      )
    }

    const clinic = await getActiveClinic()
    if (!clinic) {
      return NextResponse.json(
        { error: "No se pudo determinar la clínica activa" },
        { status: 400 }
      )
    }

    // Parsear query params
    const { searchParams } = new URL(request.url)
    const params = {
      userId: searchParams.get("userId") || undefined,
      action: searchParams.get("action") || undefined,
      entityType: searchParams.get("entityType") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
    }

    const validatedParams = auditFilterSchema.parse(params)

    // Construir filtros
    const where: any = {
      clinicId: clinic.id,
    }

    if (validatedParams.userId) {
      where.userId = validatedParams.userId
    }

    if (validatedParams.action) {
      where.action = validatedParams.action
    }

    if (validatedParams.entityType) {
      where.entityType = validatedParams.entityType
    }

    if (validatedParams.startDate || validatedParams.endDate) {
      where.createdAt = {}
      if (validatedParams.startDate) {
        where.createdAt.gte = new Date(validatedParams.startDate)
      }
      if (validatedParams.endDate) {
        where.createdAt.lte = new Date(validatedParams.endDate)
      }
    }

    // Obtener total para paginación
    const total = await prisma.auditLog.count({ where })

    // Obtener logs con paginación
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (validatedParams.page - 1) * validatedParams.limit,
      take: validatedParams.limit,
    })

    return NextResponse.json({
      logs,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total,
        totalPages: Math.ceil(total / validatedParams.limit),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error obteniendo logs de auditoría:", error)
    return NextResponse.json(
      { error: "Error al obtener logs de auditoría" },
      { status: 500 }
    )
  }
}
