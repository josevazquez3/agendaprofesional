import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getObrasSociales } from "@/lib/obra-social-helpers"

// GET - Listar solo las obras sociales activas (público para formularios)
export async function GET() {
  try {
    const obrasSocialesRaw = await getObrasSociales({
      activa: true,
      orderBy: { nombre: "asc" },
    })

    const obrasSociales = obrasSocialesRaw.map((os) => ({
      id: os.id,
      nombre: os.nombre,
      codigo: os.codigo,
    }))

    return NextResponse.json(obrasSociales)
  } catch (error: any) {
    console.error("Error obteniendo obras sociales activas:", error)
    return NextResponse.json(
      { error: "Error al obtener obras sociales" },
      { status: 500 }
    )
  }
}
