import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveClinic } from "@/lib/clinic-context"
import { auditExportSchema } from "@/lib/validations/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/audit/export
 * Exportar logs de auditoría a CSV (solo ADMIN/OWNER)
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

    // Solo ADMIN y OWNER pueden exportar auditorías
    if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      return NextResponse.json(
        { error: "No autorizado. Solo ADMIN y OWNER pueden exportar auditorías." },
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
    }

    const validatedParams = auditExportSchema.parse(params)

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

    // Obtener todos los logs (sin límite para exportación)
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            nombre: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Generar CSV
    const csvHeaders = [
      "Fecha",
      "Usuario",
      "Email",
      "Rol",
      "Acción",
      "Tipo de Entidad",
      "ID Entidad",
      "IP",
      "User Agent",
    ]

    const csvRows = logs.map((log) => {
      const date = new Date(log.createdAt).toLocaleString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
      })

      return [
        date,
        log.user.nombre || "",
        log.user.email || "",
        log.user.role || "",
        log.action,
        log.entityType,
        log.entityId || "",
        log.ipAddress || "",
        log.userAgent || "",
      ].map((field) => {
        // Escapar comillas y envolver en comillas si contiene comas
        const str = String(field || "")
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      })
    })

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n")

    // Retornar CSV como descarga
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-log-${clinic.nombre}-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error exportando logs de auditoría:", error)
    return NextResponse.json(
      { error: "Error al exportar logs de auditoría" },
      { status: 500 }
    )
  }
}
