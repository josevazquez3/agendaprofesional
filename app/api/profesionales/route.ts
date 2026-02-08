import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getProfesionales } from "@/lib/profesional-helpers"

export async function GET() {
  try {
    const profesionales = await getProfesionales({
      includeUser: true,
      includeUserFields: ["id", "nombre", "email", "telefono"],
    })

    // Obtener horarios y aranceles por separado usando SQL raw
    const profesionalesConRelaciones = await Promise.all(
      profesionales.map(async (prof) => {
        const [horarios, aranceles] = await Promise.all([
          prisma.$queryRawUnsafe<Array<any>>(
            `SELECT * FROM HorarioDisponible WHERE profesionalId = ? AND activo = 1`,
            prof.id
          ),
          prisma.$queryRawUnsafe<Array<any>>(
            `SELECT * FROM Arancel WHERE profesionalId = ? AND activo = 1 ORDER BY createdAt DESC LIMIT 1`,
            prof.id
          ),
        ])
        return {
          ...prof,
          horarios,
          aranceles,
        }
      })
    )

    return NextResponse.json(profesionalesConRelaciones)
  } catch (error) {
    console.error("Error obteniendo profesionales:", error)
    return NextResponse.json(
      { error: "Error al obtener profesionales" },
      { status: 500 }
    )
  }
}
