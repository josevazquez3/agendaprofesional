import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as fs from "fs/promises"
import * as path from "path"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { ruta } = body

    if (!ruta) {
      return NextResponse.json(
        { error: "La ruta es requerida" },
        { status: 400 }
      )
    }

    // Determinar si es ruta absoluta o relativa
    let rutaCompleta: string
    if (path.isAbsolute(ruta)) {
      rutaCompleta = ruta
    } else {
      // Ruta relativa desde la raíz del proyecto
      rutaCompleta = path.join(process.cwd(), ruta)
    }

    try {
      // Verificar si la carpeta ya existe
      try {
        const stats = await fs.stat(rutaCompleta)
        if (stats.isDirectory()) {
          return NextResponse.json({
            success: true,
            message: "La carpeta ya existe",
            ruta: rutaCompleta,
            existe: true,
          })
        }
      } catch {
        // La carpeta no existe, la crearemos
      }

      // Crear la carpeta recursivamente (incluye todas las carpetas padre necesarias)
      await fs.mkdir(rutaCompleta, { recursive: true })

      // Verificar que se creó correctamente
      const stats = await fs.stat(rutaCompleta)
      if (!stats.isDirectory()) {
        return NextResponse.json(
          { error: "No se pudo crear la carpeta" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Carpeta creada exitosamente",
        ruta: rutaCompleta,
        existe: true,
      })
    } catch (error: any) {
      console.error("Error creando carpeta:", error)
      return NextResponse.json(
        {
          error: `Error al crear la carpeta: ${error.message}`,
          ruta: rutaCompleta,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error en crear-carpeta-backup:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
}
