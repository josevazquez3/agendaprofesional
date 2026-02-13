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

    // Obtener todos los pacientes del sistema
    // Los profesionales pueden ver todos los pacientes para poder crear nuevas historias clínicas
    // Usar parámetros preparados para evitar SQL injection
    const pacientesRaw = await prisma.$queryRawUnsafe<Array<{
      id: string
      nombre: string
      dni: string | null
      email: string
      telefono: string | null
      fechaNacimiento: string | bigint | number | null
    }>>(
      `SELECT id, nombre, dni, email, telefono, fechaNacimiento
       FROM User
       WHERE role = ?
       ORDER BY nombre ASC`,
      "PACIENTE"
    )

    const pacientes = pacientesRaw.map((p) => {
      let fechaNacimiento: Date | null = null
      if (p.fechaNacimiento) {
        if (typeof p.fechaNacimiento === 'bigint') {
          fechaNacimiento = new Date(Number(p.fechaNacimiento))
        } else if (typeof p.fechaNacimiento === 'number') {
          fechaNacimiento = new Date(p.fechaNacimiento)
        } else {
          fechaNacimiento = new Date(p.fechaNacimiento)
        }
      }
      
      return {
        id: p.id,
        nombre: p.nombre,
        dni: p.dni,
        email: p.email,
        telefono: p.telefono,
        fechaNacimiento,
      }
    })

    return NextResponse.json(pacientes)
  } catch (error: any) {
    // Log error para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.error("Error obteniendo pacientes del profesional:", error)
    }
    
    return NextResponse.json(
      { 
        error: "Error al obtener pacientes. Por favor, intente nuevamente.",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
