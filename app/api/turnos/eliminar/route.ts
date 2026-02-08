import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar permisos
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SECRETARIA"
    ) {
      return NextResponse.json(
        { error: "No tiene permisos para eliminar turnos" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { turnoIds, causa } = body

    if (!turnoIds || !Array.isArray(turnoIds) || turnoIds.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron turnos para eliminar" },
        { status: 400 }
      )
    }

    if (!causa || !causa.trim()) {
      return NextResponse.json(
        { error: "La causa de eliminación es obligatoria" },
        { status: 400 }
      )
    }

    // Actualizar turnos a estado ELIMINADO usando transacción
    const fechaEliminacion = new Date()
    const causaTrimmed = causa.trim()

    // Usar transacción para asegurar atomicidad
    const resultados = await prisma.$transaction(
      turnoIds.map((turnoId: string) =>
        prisma.turno.update({
          where: { id: turnoId },
          data: {
            estado: "ELIMINADO",
            motivoEliminacion: causaTrimmed,
            eliminadoAt: fechaEliminacion,
          },
        })
      )
    )

    return NextResponse.json({
      message: `${resultados.length} turno(s) eliminado(s) exitosamente`,
      eliminados: resultados.length,
    })
  } catch (error: any) {
    console.error("Error eliminando turnos:", error)
    return NextResponse.json(
      { error: error.message || "Error al eliminar turnos" },
      { status: 500 }
    )
  }
}
