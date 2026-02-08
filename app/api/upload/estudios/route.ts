import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile } from "fs/promises"
import { join } from "path"
import { existsSync, mkdirSync } from "fs"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar permisos
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SECRETARIA" &&
      session.user.role !== "PROFESIONAL"
    ) {
      return NextResponse.json(
        { error: "No tiene permisos para subir estudios" },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      )
    }

    // Validar tipo de archivo (PDF y DOC/DOCX)
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    const allowedExtensions = [".pdf", ".doc", ".docx"]
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      return NextResponse.json(
        {
          error:
            "Tipo de archivo no permitido. Solo se permiten PDF y DOC/DOCX",
        },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Máximo 10MB" },
        { status: 400 }
      )
    }

    // Crear directorio de uploads si no existe
    const uploadDir = join(process.cwd(), "public", "uploads", "estudios")
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true })
    }

    // Generar nombre único para el archivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split(".").pop()
    const fileName = `${timestamp}-${randomString}.${extension}`
    const filePath = join(uploadDir, fileName)

    // Guardar archivo
    await writeFile(filePath, buffer)

    // Determinar tipo de archivo
    let tipoArchivo = "PDF"
    if (fileExtension === ".doc" || fileExtension === ".docx") {
      tipoArchivo = "DOC"
    }

    // Retornar URL relativa y datos del archivo
    const fileUrl = `/uploads/estudios/${fileName}`

    return NextResponse.json({
      message: "Archivo subido exitosamente",
      url: fileUrl,
      nombreArchivo: file.name,
      tipoArchivo,
      tamano: file.size,
    })
  } catch (error: any) {
    console.error("Error subiendo archivo:", error)
    return NextResponse.json(
      { error: "Error al subir el archivo" },
      { status: 500 }
    )
  }
}
