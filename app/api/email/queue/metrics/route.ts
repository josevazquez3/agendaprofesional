/**
 * Endpoint para obtener métricas de la cola de emails
 * 
 * Solo accesible para usuarios ADMIN
 */

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { emailQueue } from "@/services/email/email.queue"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const metrics = emailQueue.getMetrics()

    return NextResponse.json({
      success: true,
      metrics,
    })
  } catch (error: any) {
    console.error("Error obteniendo métricas de cola:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al obtener métricas",
      },
      { status: 500 }
    )
  }
}
