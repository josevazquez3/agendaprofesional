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

    // Obtener conteos usando SQL raw
    const [pacientesCount, turnosCount] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
        `SELECT COUNT(*) as count FROM User WHERE obraSocialId = ? AND role = 'PACIENTE'`,
        id
      ),
      prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
        `SELECT COUNT(*) as count FROM Turno WHERE obraSocial = ?`,
        obraSocial.nombre
      ),
    ])

    const pacientes = typeof pacientesCount[0]?.count === 'bigint' 
      ? Number(pacientesCount[0].count) 
      : (pacientesCount[0]?.count || 0)
    const turnos = typeof turnosCount[0]?.count === 'bigint' 
      ? Number(turnosCount[0].count) 
      : (turnosCount[0]?.count || 0)

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

    // Verificar que la obra social existe
    const obraSocialExistente = await getObraSocialById(id)

    if (!obraSocialExistente) {
      return NextResponse.json(
        { error: "Obra social no encontrada" },
        { status: 404 }
      )
    }

    // Verificar si el nuevo nombre ya existe (si se está cambiando)
    if (nombre && nombre !== obraSocialExistente.nombre) {
      const existeNombre = await getObraSocialByNombre(nombre)

      if (existeNombre) {
        return NextResponse.json(
          { error: "Ya existe una obra social con ese nombre" },
          { status: 400 }
        )
      }
    }

    // Verificar si el nuevo código ya existe (si se está cambiando)
    if (codigo && codigo !== obraSocialExistente.codigo) {
      const existeCodigo = await getObraSocialByCodigo(codigo)

      if (existeCodigo) {
        return NextResponse.json(
          { error: "Ya existe una obra social con ese código" },
          { status: 400 }
        )
      }
    }

    // Actualizar usando SQL raw
    const ahora = new Date().toISOString()
    await prisma.$executeRawUnsafe(
      `UPDATE ObraSocial 
       SET nombre = ?, codigo = ?, descripcion = ?, telefono = ?, email = ?, direccion = ?, activa = ?, updatedAt = ?
       WHERE id = ?`,
      nombre || obraSocialExistente.nombre,
      codigo !== undefined ? codigo : obraSocialExistente.codigo,
      descripcion !== undefined ? descripcion : obraSocialExistente.descripcion,
      telefono !== undefined ? telefono : obraSocialExistente.telefono,
      email !== undefined ? email : obraSocialExistente.email,
      direccion !== undefined ? direccion : obraSocialExistente.direccion,
      activa !== undefined ? (activa ? 1 : 0) : (obraSocialExistente.activa ? 1 : 0),
      ahora,
      id
    )

    const obraSocial = await getObraSocialById(id)

    return NextResponse.json(obraSocial)
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

    // Verificar que la obra social existe
    const obraSocial = await getObraSocialById(id)

    if (!obraSocial) {
      return NextResponse.json(
        { error: "Obra social no encontrada" },
        { status: 404 }
      )
    }

    // Obtener conteos
    const [pacientesCount, turnosCount] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
        `SELECT COUNT(*) as count FROM User WHERE obraSocialId = ? AND role = 'PACIENTE'`,
        id
      ),
      prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
        `SELECT COUNT(*) as count FROM Turno WHERE obraSocial = ?`,
        obraSocial.nombre
      ),
    ])

    const pacientes = typeof pacientesCount[0]?.count === 'bigint' 
      ? Number(pacientesCount[0].count) 
      : (pacientesCount[0]?.count || 0)
    const turnos = typeof turnosCount[0]?.count === 'bigint' 
      ? Number(turnosCount[0].count) 
      : (turnosCount[0]?.count || 0)

    // Verificar si tiene pacientes o turnos asociados
    if (pacientes > 0 || turnos > 0) {
      // En lugar de eliminar, marcamos como inactiva
      const ahora = new Date().toISOString()
      await prisma.$executeRawUnsafe(
        `UPDATE ObraSocial SET activa = 0, updatedAt = ? WHERE id = ?`,
        ahora,
        id
      )

      const obraSocialActualizada = await getObraSocialById(id)

      return NextResponse.json({
        message: "La obra social fue desactivada porque tiene pacientes o turnos asociados",
        obraSocial: obraSocialActualizada,
      })
    }

    // Si no tiene relaciones, eliminar físicamente
    await prisma.$executeRawUnsafe(`DELETE FROM ObraSocial WHERE id = ?`, id)

    return NextResponse.json({ message: "Obra social eliminada exitosamente" })
  } catch (error: any) {
    console.error("Error eliminando obra social:", error)
    return NextResponse.json(
      { error: error.message || "Error al eliminar obra social" },
      { status: 500 }
    )
  }
}
