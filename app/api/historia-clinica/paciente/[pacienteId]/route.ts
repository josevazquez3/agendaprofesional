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

    // Los profesionales pueden ver todas las historias clínicas del paciente
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

    return NextResponse.json(historiaClinica)
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

    // Eliminar todas las historias clínicas del paciente
    await prisma.historiaClinica.deleteMany({
      where: {
        pacienteId: params.pacienteId,
      },
    })

    return NextResponse.json({
      message: "Historia clínica eliminada exitosamente",
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
