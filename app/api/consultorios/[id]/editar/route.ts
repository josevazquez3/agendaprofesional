import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Verificar que el consultorio existe
    const consultorio = await prisma.consultorio.findUnique({
      where: { id: params.id },
    })

    if (!consultorio) {
      return NextResponse.json(
        { error: "Consultorio no encontrado" },
        { status: 404 }
      )
    }

    // Actualizar consultorio
    const consultorioActualizado = await prisma.consultorio.update({
      where: { id: params.id },
      data: {
        nombre: nombre || consultorio.nombre,
        direccion: direccion || consultorio.direccion,
        telefono: telefono !== undefined ? telefono : consultorio.telefono,
        email: email !== undefined ? email : consultorio.email,
      },
    })

    return NextResponse.json({
      message: "Consultorio actualizado exitosamente",
      consultorio: consultorioActualizado,
    })
  } catch (error: any) {
    console.error("Error actualizando consultorio:", error)
    return NextResponse.json(
      { error: "Error al actualizar consultorio" },
      { status: 500 }
    )
  }
}
