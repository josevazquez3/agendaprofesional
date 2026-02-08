import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (
      !session ||
      (session.user.role !== "SECRETARIA" && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const consultorioId = formData.get("consultorioId") as string

    if (!consultorioId) {
      return NextResponse.json(
        { error: "ID de consultorio requerido" },
        { status: 400 }
      )
    }

    // Verificar que el consultorio existe
    const consultorio = await prisma.consultorio.findUnique({
      where: { id: consultorioId },
    })

    if (!consultorio) {
      return NextResponse.json(
        { error: "Consultorio no encontrado" },
        { status: 404 }
      )
    }

    // Eliminar consultorio (las relaciones se eliminan en cascada)
    await prisma.consultorio.delete({
      where: { id: consultorioId },
    })

    return NextResponse.json({
      message: "Consultorio eliminado exitosamente",
    })
  } catch (error: any) {
    console.error("Error eliminando consultorio:", error)
    return NextResponse.json(
      { error: "Error al eliminar consultorio" },
      { status: 500 }
    )
  }
}
