import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/user-helpers"
import { requireAuth, verifyPatientOwnership, createAuthErrorResponse } from "@/lib/auth-helpers"

export async function GET(
  request: Request,
  { params }: { params: { pacienteId: string } }
) {
  try {
    // Validar autenticación básica
    const authResult = await requireAuth()

    if (!authResult || !authResult.allowed) {
      return authResult?.error || createAuthErrorResponse("UNAUTHORIZED")
    }

    const session = authResult.session

    // Verificar permisos: PACIENTE solo puede ver sus propias historias
    if (session.user.role === "PACIENTE") {
      if (!verifyPatientOwnership(params.pacienteId, session.user.id)) {
        return createAuthErrorResponse("OWNERSHIP_REQUIRED")
      }
    } else if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SECRETARIA" &&
      session.user.role !== "PROFESIONAL"
    ) {
      return createAuthErrorResponse("FORBIDDEN")
    }

    // Verificar que el paciente existe usando helper
    const paciente = await getUserById(params.pacienteId)

    if (!paciente || paciente.role !== "PACIENTE") {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      )
    }

    // Asegurar columnas de eliminación lógica (por si no se ejecutó db push)
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE HistoriaClinica ADD COLUMN eliminadoAt DATETIME`)
    } catch { /* ya existe */ }
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE HistoriaClinica ADD COLUMN motivoEliminacion TEXT`)
    } catch { /* ya existe */ }
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE HistoriaClinica ADD COLUMN eliminadoPorId TEXT`)
    } catch { /* ya existe */ }

    const historiaClinica = await prisma.historiaClinica.findMany({
      where: {
        pacienteId: params.pacienteId,
      },
      include: {
        profesional: {
          select: {
            id: true,
            especialidad: true,
            user: {
              select: {
                nombre: true,
              },
            },
          },
        },
        turno: {
          select: {
            fecha: true,
            hora: true,
            estado: true,
            motivo: true,
            motivoEliminacion: true,
            eliminadoAt: true,
          },
        },
        archivos: {
          select: {
            id: true,
            nombreArchivo: true,
            tipoArchivo: true,
            urlArchivo: true,
          },
        },
      },
      orderBy: {
        fechaConsulta: "desc",
      },
    })

    // Enriquecer con nombre de quien eliminó (por si la relación no está en el cliente)
    const eliminadoPorIds = [...new Set((historiaClinica as any[]).map((h: any) => h.eliminadoPorId).filter(Boolean))]
    let eliminadoPorMap: Record<string, { nombre: string }> = {}
    if (eliminadoPorIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: eliminadoPorIds } },
        select: { id: true, nombre: true },
      })
      eliminadoPorMap = Object.fromEntries(users.map((u) => [u.id, { nombre: u.nombre }]))
    }
    const result = (historiaClinica as any[]).map((h) => ({
      ...h,
      eliminadoPor: h.eliminadoPorId ? eliminadoPorMap[h.eliminadoPorId] : null,
    }))

    return NextResponse.json(result)
  } catch (error: any) {
    // Log error para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.error("Error obteniendo historia clínica:", error)
    } else {
      // En producción, solo log crítico sin detalles sensibles
      console.error("Error obteniendo historia clínica")
    }
    
    if (error.code === "P2025") {
      return createAuthErrorResponse("NOT_FOUND")
    }
    
    return NextResponse.json(
      { error: "Error al obtener historia clínica. Por favor, intente nuevamente." },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { pacienteId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "SECRETARIA")
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    let causa = ""
    try {
      const body = await request.json()
      causa = (body?.causa ?? "").trim()
    } catch {
      // body opcional
    }
    if (!causa) {
      return NextResponse.json(
        { error: "La causa de eliminación es obligatoria." },
        { status: 400 }
      )
    }

    const ahora = new Date()
    const userId = session.user.id

    // Eliminación lógica con el cliente Prisma para garantizar que impacte en la BD
    const result = await prisma.historiaClinica.updateMany({
      where: { pacienteId: params.pacienteId },
      data: {
        eliminadoAt: ahora,
        motivoEliminacion: causa,
        eliminadoPorId: userId,
      },
    })

    return NextResponse.json({
      message: "Historia clínica del paciente marcada como eliminada (eliminación lógica).",
      actualizados: result.count,
    })
  } catch (error: any) {
    // Log error para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.error("Error eliminando historia clínica:", error)
    }
    
    if (error.code === "P2025") {
      return createAuthErrorResponse("NOT_FOUND")
    }
    
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "No se puede eliminar porque tiene datos relacionados." },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Error al eliminar historia clínica. Por favor, intente nuevamente." },
      { status: 500 }
    )
  }
}
