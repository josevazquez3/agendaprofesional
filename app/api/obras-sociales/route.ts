import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getObrasSociales, getObraSocialByNombre, getObraSocialByCodigo, getObraSocialById } from "@/lib/obra-social-helpers"
import { getActiveClinic } from "@/lib/clinic-context"

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

    const clinic = await getActiveClinic()
    if (!clinic) {
      return NextResponse.json(
        { error: "No se pudo determinar la clínica activa" },
        { status: 400 }
      )
    }

    // Verificar si ya existe una obra social con el mismo nombre en esta clínica
    const existeNombre = await getObraSocialByNombre(nombre, clinic.id)
    if (existeNombre) {
      return NextResponse.json(
        { error: "Ya existe una obra social con ese nombre" },
        { status: 400 }
      )
    }

    if (codigo) {
      const existeCodigo = await getObraSocialByCodigo(codigo, clinic.id)
      if (existeCodigo) {
        return NextResponse.json(
          { error: "Ya existe una obra social con ese código" },
          { status: 400 }
        )
      }
    }

    const obraSocial = await prisma.obraSocial.create({
      data: {
        clinicId: clinic.id,
        nombre: nombre.trim(),
        codigo: codigo?.trim() || null,
        descripcion: descripcion?.trim() || null,
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        direccion: direccion?.trim() || null,
        activa: activa !== undefined ? !!activa : true,
      },
    })

    return NextResponse.json(obraSocial, { status: 201 })
  } catch (error: any) {
    console.error("Error creando obra social:", error)
    return NextResponse.json(
      { error: error.message || "Error al crear obra social" },
      { status: 500 }
    )
  }
}
