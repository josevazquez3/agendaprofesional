import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getConfiguracion, saveConfiguracion } from "@/lib/configuracion-helpers"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const config = await getConfiguracion()
    return NextResponse.json(config)
  } catch (error: any) {
    console.error("Error obteniendo configuración:", error)
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    await saveConfiguracion(body)

    return NextResponse.json({ success: true, message: "Configuración guardada exitosamente" })
  } catch (error: any) {
    console.error("Error guardando configuración:", error)
    return NextResponse.json(
      { error: error.message || "Error al guardar configuración" },
      { status: 500 }
    )
  }
}
