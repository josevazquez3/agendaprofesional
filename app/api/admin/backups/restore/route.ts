import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { restoreFromBackup } from "@/lib/backup-service"

/**
 * POST /api/admin/backups/restore
 * Restaurar la base de datos desde un archivo de backup (ZIP o JSON)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "PLATFORM_OWNER") {
      return NextResponse.json(
        { error: "Solo administradores pueden restaurar backups" },
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

    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith(".zip") && !fileName.endsWith(".json")) {
      return NextResponse.json(
        { error: "El archivo debe ser un backup .zip o .json generado por el sistema" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const { restoredTables } = await restoreFromBackup(buffer)

    return NextResponse.json({
      success: true,
      message: `Base de datos restaurada correctamente. ${restoredTables} tablas importadas.`,
      restoredTables,
    })
  } catch (error) {
    console.error("Error restaurando backup:", error)
    const message = error instanceof Error ? error.message : "Error al restaurar el backup"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
