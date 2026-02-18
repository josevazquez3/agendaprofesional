import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getObraSocialById, getObraSocialByNombre, getObraSocialByCodigo } from "@/lib/obra-social-helpers"

// GET - Obtener una obra social específica
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Solo ADMIN y SECRETARIA pueden ver obras sociales
    if (session.user.role !== "ADMIN" && session.user.role !== "SECRETARIA") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const obraSocial = await getObraSocialById(id)

    if (!obraSocial) {
      return NextResponse.json(
        { error: "Obra social no encontrada" },
        { status: 404 }
      )
    }

    const [pacientes, turnos] = await Promise.all([
      prisma.user.count({ where: { obraSocialId: id, role: "PACIENTE" } }),
      prisma.turno.count({ where: { obraSocial: obraSocial.nombre } }),
    ])

    return NextResponse.json({
      ...obraSocial,
      _count: {
        pacientes,
        turnos,
      },
    })
  } catch (error: any) {
    console.error("Error obteniendo obra social:", error)
    return NextResponse.json(
      { error: "Error al obtener obra social" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar una obra social
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Solo ADMIN puede actualizar obras sociales
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const { nombre, codigo, descripcion, telefono, email, direccion, activa } = body

    const obraSocialExistente = await prisma.obraSocial.findUnique({
      where: { id },
    })

    if (!obraSocialExistente) {
      return NextResponse.json(
        { error: "Obra social no encontrada" },
        { status: 404 }
      )
    }

    if (nombre && nombre !== obraSocialExistente.nombre) {
      const existeNombre = await getObraSocialByNombre(nombre, obraSocialExistente.clinicId)
      if (existeNombre) {
        return NextResponse.json(
          { error: "Ya existe una obra social con ese nombre" },
          { status: 400 }
        )
      }
    }

    if (codigo !== undefined && codigo !== obraSocialExistente.codigo) {
      const existeCodigo = await getObraSocialByCodigo(codigo, obraSocialExistente.clinicId)
      if (existeCodigo) {
        return NextResponse.json(
          { error: "Ya existe una obra social con ese código" },
          { status: 400 }
        )
      }
    }

    const obraSocial = await prisma.obraSocial.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(codigo !== undefined && { codigo: codigo?.trim() || null }),
        ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null }),
        ...(telefono !== undefined && { telefono: telefono?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(direccion !== undefined && { direccion: direccion?.trim() || null }),
        ...(activa !== undefined && { activa: !!activa }),
      },
    })

    return NextResponse.json({
      id: obraSocial.id,
      nombre: obraSocial.nombre,
      codigo: obraSocial.codigo,
      descripcion: obraSocial.descripcion,
      telefono: obraSocial.telefono,
      email: obraSocial.email,
      direccion: obraSocial.direccion,
      activa: obraSocial.activa,
      createdAt: obraSocial.createdAt,
      updatedAt: obraSocial.updatedAt,
    })
  } catch (error: any) {
    console.error("Error actualizando obra social:", error)
    return NextResponse.json(
      { error: error.message || "Error al actualizar obra social" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar una obra social
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Solo ADMIN puede eliminar obras sociales
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const obraSocial = await getObraSocialById(id)

    if (!obraSocial) {
      return NextResponse.json(
        { error: "Obra social no encontrada" },
        { status: 404 }
      )
    }

    const [pacientes, turnos] = await Promise.all([
      prisma.user.count({ where: { obraSocialId: id, role: "PACIENTE" } }),
      prisma.turno.count({ where: { obraSocial: obraSocial.nombre } }),
    ])

    if (pacientes > 0 || turnos > 0) {
      await prisma.obraSocial.update({
        where: { id },
        data: { activa: false },
      })
      const obraSocialActualizada = await getObraSocialById(id)
      return NextResponse.json({
        message: "La obra social fue desactivada porque tiene pacientes o turnos asociados",
        obraSocial: obraSocialActualizada,
      })
    }

    await prisma.obraSocial.delete({ where: { id } })

    return NextResponse.json({ message: "Obra social eliminada exitosamente" })
  } catch (error: any) {
    console.error("Error eliminando obra social:", error)
    return NextResponse.json(
      { error: error.message || "Error al eliminar obra social" },
      { status: 500 }
    )
  }
}
