import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveClinic } from "@/lib/clinic-context"
import { createBackupJobSchema } from "@/lib/validations/backup"
import { z } from "zod"

/**
 * GET /api/admin/backups
 * Listar backup jobs de la clínica activa
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

    // Solo ADMIN puede ver backups
    if (session.user.role !== "ADMIN" && session.user.role !== "PLATFORM_OWNER") {
      return NextResponse.json(
        { error: "No autorizado" },
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

    const jobs = await prisma.backupJob.findMany({
      where: { clinicId: clinic.id },
      include: {
        logs: {
          orderBy: {
            executedAt: "desc",
          },
          take: 10, // Últimos 10 logs
        },
        _count: {
          select: {
            logs: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error("Error obteniendo backup jobs:", error)
    return NextResponse.json(
      { error: "Error al obtener backup jobs" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/backups
 * Crear nuevo backup job
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "PLATFORM_OWNER") {
      return NextResponse.json(
        { error: "No autorizado" },
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

    const body = await request.json()
    const validatedData = createBackupJobSchema.parse({
      ...body,
      clinicId: clinic.id,
    })

    const job = await prisma.backupJob.create({
      data: validatedData,
    })

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creando backup job:", error)
    return NextResponse.json(
      { error: "Error al crear backup job" },
      { status: 500 }
    )
  }
}
