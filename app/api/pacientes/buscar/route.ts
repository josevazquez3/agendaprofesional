import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUsers } from "@/lib/user-helpers"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({ pacientes: [] })
    }

    const pacientesRaw = await getUsers({
      role: "PACIENTE",
      search: query,
      take: 10,
    })

    const pacientes = pacientesRaw.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      dni: p.dni,
      email: p.email,
    }))

    return NextResponse.json({ pacientes })
  } catch (error) {
    console.error("Error buscando pacientes:", error)
    return NextResponse.json(
      { error: "Error al buscar pacientes" },
      { status: 500 }
    )
  }
}
