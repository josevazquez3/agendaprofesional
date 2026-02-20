import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUsers } from "@/lib/user-helpers"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const pacientesRaw = await getUsers({
      role: "PACIENTE",
      orderBy: { nombre: "asc" },
    })

    const pacientes = pacientesRaw.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      email: p.email,
      telefono: p.telefono,
      dni: p.dni,
      fechaNacimiento: p.fechaNacimiento,
    }))

    return NextResponse.json(pacientes)
  } catch (error) {
    console.error("Error obteniendo pacientes:", error)
    return NextResponse.json(
      { error: "Error al obtener pacientes" },
      { status: 500 }
    )
  }
}
