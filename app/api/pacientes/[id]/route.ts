import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserById } from "@/lib/user-helpers"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const pacienteRaw = await getUserById(params.id)

    if (!pacienteRaw || pacienteRaw.role !== "PACIENTE") {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      )
    }

    const paciente = {
      id: pacienteRaw.id,
      nombre: pacienteRaw.nombre,
      dni: pacienteRaw.dni,
      email: pacienteRaw.email,
      fechaNacimiento: pacienteRaw.fechaNacimiento,
      telefono: pacienteRaw.telefono,
      direccion: pacienteRaw.direccion,
      obraSocial: pacienteRaw.obraSocial,
    }

    return NextResponse.json(paciente)
  } catch (error) {
    console.error("Error obteniendo paciente:", error)
    return NextResponse.json(
      { error: "Error al obtener paciente" },
      { status: 500 }
    )
  }
}
