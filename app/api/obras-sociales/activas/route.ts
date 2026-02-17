import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Listar solo las obras sociales activas (público para formularios)
export async function GET() {
  try {
    const obrasSociales = await prisma.obraSocial.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, codigo: true },
    })

    return NextResponse.json(obrasSociales)
  } catch (error: unknown) {
    console.error("Error obteniendo obras sociales activas:", error)
    return NextResponse.json(
      { error: "Error al obtener obras sociales" },
      { status: 500 }
    )
  }
}
