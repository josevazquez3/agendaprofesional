import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProfesionalById } from "@/lib/profesional-helpers"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const profesional = await getProfesionalById(params.id, {
      includeUser: true,
      includeUserFields: ["nombre", "email", "telefono", "dni", "obraSocial", "fotoPerfil"],
    })

    if (!profesional) {
      return NextResponse.json(
        { error: "Profesional no encontrado" },
        { status: 404 }
      )
    }

    // Obtener aranceles usando SQL raw
    const aranceles = await prisma.$queryRawUnsafe<Array<any>>(
      `SELECT * FROM Arancel WHERE profesionalId = ? AND activo = 1 ORDER BY createdAt DESC`,
      profesional.id
    )

    return NextResponse.json({
      ...profesional,
      aranceles,
    })
  } catch (error) {
    console.error("Error obteniendo profesional:", error)
    return NextResponse.json(
      { error: "Error al obtener profesional" },
      { status: 500 }
    )
  }
}
