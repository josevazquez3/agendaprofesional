import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUsers } from "@/lib/user-helpers"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "PROFESIONAL") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener el profesional
    const profesional = await prisma.profesional.findUnique({
      where: { userId: session.user.id },
    })

    if (!profesional) {
      return NextResponse.json(
        { error: "Profesional no encontrado" },
        { status: 404 }
      )
    }

    // Obtener todos los pacientes únicos que tienen historias clínicas (de cualquier profesional)
    const historiasClinicas = await prisma.historiaClinica.findMany({
      select: {
        pacienteId: true,
      },
      distinct: ["pacienteId"],
    })

    // Obtener información de los pacientes usando SQL raw
    const pacienteIds = historiasClinicas.map((hc) => hc.pacienteId)
    
    if (pacienteIds.length === 0) {
      return NextResponse.json([])
    }

    const placeholders = pacienteIds.map(() => "?").join(",")
    const pacientesRaw = await prisma.$queryRawUnsafe<Array<{
      id: string
      nombre: string
      dni: string | null
      email: string
      fechaNacimiento: string | null
    }>>(
      `SELECT id, nombre, dni, email, fechaNacimiento 
       FROM User 
       WHERE id IN (${placeholders}) AND role = 'PACIENTE'`,
      ...pacienteIds
    )

    const pacientes = pacientesRaw.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      dni: p.dni,
      email: p.email,
      fechaNacimiento: p.fechaNacimiento ? new Date(p.fechaNacimiento) : null,
    }))

    return NextResponse.json(pacientes)
  } catch (error) {
    console.error("Error obteniendo pacientes del profesional:", error)
    return NextResponse.json(
      { error: "Error al obtener pacientes" },
      { status: 500 }
    )
  }
}
