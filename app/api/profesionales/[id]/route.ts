import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProfesionalById } from "@/lib/profesional-helpers"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const profesional = await getProfesionalById(id, {
      includeUser: true,
      includeUserFields: ["nombre", "email", "telefono", "dni", "obraSocial", "fotoPerfil"],
    })

    if (!profesional) {
      return NextResponse.json(
        { error: "Profesional no encontrado" },
        { status: 404 }
      )
    }

    const [aranceles, consultoriosAsignados, profesionalConClinic] = await Promise.all([
      prisma.arancel.findMany({
        where: { profesionalId: id, activo: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.consultorioProfesional.findMany({
        where: { profesionalId: id },
        include: {
          consultorio: { select: { id: true, nombre: true, direccion: true } },
        },
      }),
      prisma.profesional.findUnique({
        where: { id },
        select: { clinicId: true },
      }),
    ])

    return NextResponse.json({
      ...profesional,
      clinicId: profesionalConClinic?.clinicId ?? null,
      aranceles,
      consultoriosAsignados,
    })
  } catch (error) {
    console.error("Error obteniendo profesional:", error)
    return NextResponse.json(
      { error: "Error al obtener profesional" },
      { status: 500 }
    )
  }
}
