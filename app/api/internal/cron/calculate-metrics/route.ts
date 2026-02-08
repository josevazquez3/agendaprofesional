import { NextRequest, NextResponse } from "next/server"
import { calculateAllClinicsMetrics } from "@/lib/usage-metrics"

/**
 * POST /api/internal/cron/calculate-metrics
 * Endpoint para cron job que calcula métricas diarias de todas las clínicas
 * 
 * Compatible con:
 * - Vercel Cron: Configurar en vercel.json
 * - node-cron: Ejecutar manualmente o con scheduler
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

    console.log("🔄 Iniciando cálculo de métricas diarias...")
    
    await calculateAllClinicsMetrics()

    console.log("✅ Métricas calculadas exitosamente")

    return NextResponse.json({
      success: true,
      message: "Métricas calculadas exitosamente",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error calculando métricas:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al calcular métricas",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/internal/cron/calculate-metrics
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
