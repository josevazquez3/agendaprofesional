import { NextRequest, NextResponse } from "next/server"
import { runScheduledBackups } from "@/lib/backup-scheduler"

/**
 * POST /api/internal/cron/run-backups
 * Endpoint para cron job que ejecuta backups programados
 * 
 * Compatible con:
 * - Vercel Cron: Configurar en vercel.json
 * - node-cron: Ejecutar cada hora
 * 
 * Seguridad: Agregar header de autorización en producción
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autorización (header secreto para cron)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    console.log("🔄 Iniciando ejecución de backups programados...")
    
    await runScheduledBackups()

    console.log("✅ Backups programados ejecutados")

    return NextResponse.json({
      success: true,
      message: "Backups programados ejecutados",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error ejecutando backups programados:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al ejecutar backups programados",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/internal/cron/run-backups
 * Endpoint alternativo para ejecución manual (desarrollo/testing)
 */
export async function GET(request: NextRequest) {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Método no permitido en producción" },
      { status: 405 }
    )
  }

  return POST(request)
}
