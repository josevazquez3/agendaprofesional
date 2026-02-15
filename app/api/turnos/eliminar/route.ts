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

    const causaTrimmed = causa.trim()
    const eliminadoPorId = session.user.id
    const eliminadoAt = new Date().toISOString()

    // Asegurar que las columnas existan en SQLite (ignorar si ya existen)
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE Turno ADD COLUMN eliminadoAt TEXT`)
    } catch { /* ya existe */ }
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE Turno ADD COLUMN motivoEliminacion TEXT`)
    } catch { /* ya existe */ }
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE Turno ADD COLUMN eliminadoPorId TEXT`)
    } catch { /* ya existe */ }

    let actualizados = 0
    for (const turnoId of turnoIds) {
      const id = String(turnoId).trim()
      if (!id) continue
      try {
        const result = await prisma.$executeRaw`
          UPDATE Turno
          SET estado = ${"ELIMINADO"},
              motivoEliminacion = ${causaTrimmed},
              eliminadoAt = ${eliminadoAt},
              eliminadoPorId = ${eliminadoPorId}
          WHERE id = ${id}
        `
        const affected = typeof result === "number" ? result : 0
        if (affected > 0) actualizados++
      } catch (rawErr) {
        // Fallback: algunos entornos Prisma/SQLite fallan con $executeRaw template
        const r = await prisma.$executeRawUnsafe(
          "UPDATE Turno SET estado = ?, motivoEliminacion = ?, eliminadoAt = ?, eliminadoPorId = ? WHERE id = ?",
          "ELIMINADO",
          causaTrimmed,
          eliminadoAt,
          eliminadoPorId,
          id
        )
        if (Number(r) > 0) actualizados++
      }
    }

    if (actualizados === 0 && turnoIds.length > 0) {
      return NextResponse.json(
        { error: "No se encontró ningún turno con ese ID para actualizar. ¿El turno existe?" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: `${actualizados} turno(s) marcado(s) como eliminado(s)`,
      eliminados: actualizados,
    })
  } catch (error: any) {
    console.error("Error eliminando turnos:", error)
    return NextResponse.json(
      { error: error.message || "Error al eliminar turnos" },
      { status: 500 }
    )
  }
}
