import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params)
    if (!id) {
      return NextResponse.json({ error: "ID de profesional no válido" }, { status: 400 })
    }
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Aceptar tanto id de Profesional como userId (por si el enlace viene de usuarios u otro flujo)
    const prof =
      (await prisma.profesional.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              email: true,
              telefono: true,
              dni: true,
              fotoPerfil: true,
              obraSocial: true,
            },
          },
        },
      })) ??
      (await prisma.profesional.findUnique({
        where: { userId: id },
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              email: true,
              telefono: true,
              dni: true,
              fotoPerfil: true,
              obraSocial: true,
            },
          },
        },
      }))

    if (!prof) {
      return NextResponse.json(
        { error: "Profesional no encontrado" },
        { status: 404 }
      )
    }

    const profesionalId = prof.id

    if (!prof.user) {
      return NextResponse.json(
        { error: "Datos del usuario del profesional no encontrados" },
        { status: 404 }
      )
    }

    const profesional = {
      id: prof.id,
      userId: prof.userId,
      especialidad: prof.especialidad,
      matricula: prof.matricula,
      atiendeObraSocial: prof.atiendeObraSocial,
      createdAt: prof.createdAt,
      updatedAt: prof.updatedAt,
      user: prof.user,
    }

    let aranceles: Awaited<ReturnType<typeof prisma.arancel.findMany>> = []
    let consultoriosAsignados: Awaited<ReturnType<typeof prisma.consultorioProfesional.findMany>> = []
    let clinicId: string | null = null

    try {
      const [arancelesRes, consultoriosRes, profClinic] = await Promise.all([
        prisma.arancel.findMany({
          where: { profesionalId: profesionalId, activo: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.consultorioProfesional.findMany({
          where: { profesionalId: profesionalId },
          include: {
            consultorio: { select: { id: true, nombre: true, direccion: true } },
          },
        }),
        prisma.profesional.findUnique({
          where: { id: profesionalId },
          select: { clinicId: true },
        }),
      ])
      aranceles = arancelesRes
      consultoriosAsignados = consultoriosRes
      clinicId = profClinic?.clinicId ?? null
    } catch (extraError) {
      console.error("Error cargando aranceles/consultorios/clinicId (se devuelve profesional sin ellos):", extraError)
    }

    return NextResponse.json({
      ...profesional,
      clinicId,
      aranceles,
      consultoriosAsignados,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Error obteniendo profesional:", error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
