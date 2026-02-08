import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveClinic } from "@/lib/clinic-context"
import * as fs from "fs/promises"
import * as path from "path"

/**
 * GET /api/admin/backups/download/:logId
 * Descargar archivo de backup
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { logId: string } }
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

    const log = await prisma.backupLog.findUnique({
      where: { id: params.logId },
      include: {
        job: {
          select: {
            clinicId: true,
          },
        },
      },
    })

    if (!log) {
      return NextResponse.json(
        { error: "Backup log no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que el backup pertenece a la clínica del usuario
    if (log.job?.clinicId !== clinic.id && session.user.role !== "PLATFORM_OWNER") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    if (!log.fileUrl) {
      return NextResponse.json(
        { error: "No hay archivo asociado a este backup" },
        { status: 404 }
      )
    }

    // Por ahora solo soportamos almacenamiento local
    if (!log.fileUrl.startsWith("/backups/")) {
      return NextResponse.json(
        { error: "Tipo de almacenamiento no soportado para descarga directa" },
        { status: 400 }
      )
    }

    // Construir ruta absoluta
    const filePath = path.join(process.cwd(), log.fileUrl)

    try {
      // Verificar que el archivo existe
      await fs.access(filePath)

      // Leer archivo
      const fileBuffer = await fs.readFile(filePath)
      const fileName = path.basename(log.fileUrl)

      // Retornar archivo como descarga
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Length": fileBuffer.length.toString(),
        },
      })
    } catch (fileError) {
      return NextResponse.json(
        { error: "Archivo de backup no encontrado en el servidor" },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error("Error descargando backup:", error)
    return NextResponse.json(
      { error: "Error al descargar backup" },
      { status: 500 }
    )
  }
}
