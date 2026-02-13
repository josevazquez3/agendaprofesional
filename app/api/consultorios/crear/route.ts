import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveClinic } from "@/lib/clinic-context"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (
      !session ||
      (session.user.role !== "SECRETARIA" && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, direccion, telefono, email } = body

    // Validaciones
    if (!nombre || !direccion) {
      return NextResponse.json(
        { error: "Nombre y dirección son requeridos" },
        { status: 400 }
      )
    }

    // Obtener clínica activa
    const clinic = await getActiveClinic()
    if (!clinic) {
      return NextResponse.json(
        { error: "No se pudo determinar la clínica activa" },
        { status: 400 }
      )
    }

    // Crear consultorio
    const consultorio = await prisma.consultorio.create({
      data: {
        clinicId: clinic.id,
        nombre,
        direccion,
        telefono: telefono || null,
        email: email || null,
      },
    })

    return NextResponse.json(
      {
        message: "Consultorio creado exitosamente",
        consultorio,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creando consultorio:", error)
    return NextResponse.json(
      { error: "Error al crear consultorio" },
      { status: 500 }
    )
  }
}
