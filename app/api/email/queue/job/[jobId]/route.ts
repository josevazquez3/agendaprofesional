/**
 * Endpoint para obtener el estado de un job específico
 * 
 * Solo accesible para usuarios ADMIN
 */

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { emailQueue } from "@/services/email/email.queue"

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { jobId } = params
    const status = emailQueue.getJobStatus(jobId)

    return NextResponse.json({
      success: true,
      jobId,
      status: status.status,
      job: status.job,
    })
  } catch (error: any) {
    console.error("Error obteniendo estado de job:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al obtener estado del job",
      },
      { status: 500 }
    )
  }
}
