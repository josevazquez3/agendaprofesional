import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/user-helpers"

export async function GET(
  request: Request,
  { params }: { params: { pacienteId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar permisos
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SECRETARIA" &&
      session.user.role !== "PROFESIONAL" &&
      (session.user.role === "PACIENTE" && session.user.id !== params.pacienteId)
    ) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
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

    console.log(`Historia clínica encontrada para paciente ${params.pacienteId}:`, historiaClinica.length, "registros")

    return NextResponse.json(historiaClinica)
  } catch (error) {
    console.error("Error obteniendo historia clínica:", error)
    return NextResponse.json(
      { error: "Error al obtener historia clínica" },
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
  } catch (error) {
    console.error("Error eliminando historia clínica:", error)
    return NextResponse.json(
      { error: "Error al eliminar historia clínica" },
      { status: 500 }
    )
  }
}
