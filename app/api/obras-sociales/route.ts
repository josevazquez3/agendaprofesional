import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getObrasSociales, getObraSocialByNombre, getObraSocialByCodigo } from "@/lib/obra-social-helpers"

// GET - Listar todas las obras sociales
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Solo ADMIN y SECRETARIA pueden ver todas las obras sociales
    if (session.user.role !== "ADMIN" && session.user.role !== "SECRETARIA") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const obrasSociales = await getObrasSociales({
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json(obrasSociales)
  } catch (error: any) {
    console.error("Error obteniendo obras sociales:", error)
    return NextResponse.json(
      { error: "Error al obtener obras sociales" },
      { status: 500 }
    )
  }
}

// POST - Crear una nueva obra social
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Solo ADMIN puede crear obras sociales
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { nombre, codigo, descripcion, telefono, email, direccion, activa } = body

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      )
    }

    // Verificar si ya existe una obra social con el mismo nombre
    const existeNombre = await getObraSocialByNombre(nombre)

    if (existeNombre) {
      return NextResponse.json(
        { error: "Ya existe una obra social con ese nombre" },
        { status: 400 }
      )
    }

    // Verificar si ya existe una obra social con el mismo código (si se proporciona)
    if (codigo) {
      const existeCodigo = await getObraSocialByCodigo(codigo)

      if (existeCodigo) {
        return NextResponse.json(
          { error: "Ya existe una obra social con ese código" },
          { status: 400 }
        )
      }
    }

    // Crear obra social usando SQL raw
    const id = `os_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const ahora = new Date().toISOString()
    
    await prisma.$executeRawUnsafe(
      `INSERT INTO ObraSocial (id, nombre, codigo, descripcion, telefono, email, direccion, activa, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      nombre,
      codigo || null,
      descripcion || null,
      telefono || null,
      email || null,
      direccion || null,
      activa !== undefined ? (activa ? 1 : 0) : 1,
      ahora,
      ahora
    )

    const obraSocial = await getObraSocialById(id)

    return NextResponse.json(obraSocial, { status: 201 })
  } catch (error: any) {
    console.error("Error creando obra social:", error)
    return NextResponse.json(
      { error: error.message || "Error al crear obra social" },
      { status: 500 }
    )
  }
}
