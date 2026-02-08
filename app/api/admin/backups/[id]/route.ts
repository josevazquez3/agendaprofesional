import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveClinic } from "@/lib/clinic-context"
import { updateBackupJobSchema } from "@/lib/validations/backup"
import { z } from "zod"

/**
 * PATCH /api/admin/backups/:id
 * Actualizar backup job
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const job = await prisma.backupJob.findUnique({
      where: { id: params.id },
    })

    if (!job) {
      return NextResponse.json(
        { error: "Backup job no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que el job pertenece a la clínica del usuario
    if (job.clinicId !== clinic.id && session.user.role !== "PLATFORM_OWNER") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateBackupJobSchema.parse(body)

    const updatedJob = await prisma.backupJob.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json({ job: updatedJob })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error actualizando backup job:", error)
    return NextResponse.json(
      { error: "Error al actualizar backup job" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/backups/:id
 * Eliminar backup job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const job = await prisma.backupJob.findUnique({
      where: { id: params.id },
    })

    if (!job) {
      return NextResponse.json(
        { error: "Backup job no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que el job pertenece a la clínica del usuario
    if (job.clinicId !== clinic.id && session.user.role !== "PLATFORM_OWNER") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    await prisma.backupJob.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error eliminando backup job:", error)
    return NextResponse.json(
      { error: "Error al eliminar backup job" },
      { status: 500 }
    )
  }
}
