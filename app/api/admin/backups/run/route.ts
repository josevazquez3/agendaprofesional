import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getActiveClinic } from "@/lib/clinic-context"
import { createBackup } from "@/lib/backup-service"
import { runBackupJob } from "@/lib/backup-service"
import { runBackupSchema } from "@/lib/validations/backup"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

/**
 * POST /api/admin/backups/run
 * Ejecutar backup manualmente (ahora)
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
    const { jobId, clinicId: bodyClinicId } = runBackupSchema.parse(body)

    const targetClinicId = bodyClinicId || clinic.id

    // Si se proporciona jobId, ejecutar ese job
    if (jobId) {
      const job = await prisma.backupJob.findUnique({
        where: { id: jobId },
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

      await runBackupJob(jobId)

      const updatedJob = await prisma.backupJob.findUnique({
        where: { id: jobId },
        include: {
          logs: {
            orderBy: {
              executedAt: "desc",
            },
            take: 1,
          },
        },
      })

      return NextResponse.json({
        success: true,
        job: updatedJob,
        log: updatedJob?.logs[0],
      })
    }

    // Si no hay jobId, crear backup manual inmediato (usa ruta configurada si se envía)
    const storageType = (body.storageType as "local" | "s3" | "gcs") || "local"
    const storagePath = typeof body.storagePath === "string" && body.storagePath.trim() ? body.storagePath.trim() : undefined
    const { fileUrl, sizeMB } = await createBackup(targetClinicId, storageType, storagePath)

    // Buscar o crear job manual para este backup
    let manualJob = await prisma.backupJob.findFirst({
      where: {
        clinicId: targetClinicId,
        frequency: "manual",
      },
    })

    if (!manualJob) {
      manualJob = await prisma.backupJob.create({
        data: {
          clinicId: targetClinicId,
          frequency: "manual",
          storageType: storageType,
          status: "active",
        },
      })
    }

    // Actualizar job con última ejecución
    await prisma.backupJob.update({
      where: { id: manualJob.id },
      data: {
        lastRunAt: new Date(),
        storagePath: fileUrl,
      },
    })

    // Crear log de backup manual
    const log = await prisma.backupLog.create({
      data: {
        jobId: manualJob.id,
        executedAt: new Date(),
        fileUrl,
        status: "success",
        sizeMB,
      },
    })

    return NextResponse.json({
      success: true,
      fileUrl,
      sizeMB,
      log,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error ejecutando backup:", error)
    const err = error as NodeJS.ErrnoException
    let message = error instanceof Error ? error.message : "Error desconocido"
    if (err?.code === "EACCES") {
      message = "No hay permiso para escribir en la carpeta. Prueba otra ruta (ej. Escritorio) o ejecuta la aplicación con permisos."
    } else if (err?.code === "ENOENT") {
      message = "La carpeta no existe. Comprueba la ruta o créala en el Explorador antes de hacer la copia."
    }
    return NextResponse.json(
      {
        error: "Error al ejecutar backup",
        details: message,
      },
      { status: 500 }
    )
  }
}
