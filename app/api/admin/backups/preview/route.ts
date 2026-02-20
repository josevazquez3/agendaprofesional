import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getBackupPreview } from "@/lib/backup-service"

/**
 * POST /api/admin/backups/preview
 * Obtener vista previa de un backup sin restaurar (tablas, cantidades, muestra de datos)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "PLATFORM_OWNER") {
      return NextResponse.json(
        { error: "Solo administradores pueden ver la vista previa de backups" },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "Debe seleccionar un archivo (ZIP o JSON)" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const preview = getBackupPreview(buffer)

    return NextResponse.json(preview)
  } catch (error) {
    console.error("Error en vista previa de backup:", error)
    const message = error instanceof Error ? error.message : "Error al leer el archivo de backup"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
