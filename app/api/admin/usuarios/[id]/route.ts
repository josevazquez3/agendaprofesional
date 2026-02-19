import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserById, getUserByEmail, getUserByDni } from "@/lib/user-helpers"
import bcrypt from "bcryptjs"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userRaw = await getUserById(id)

    if (!userRaw) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    let profesional = null
    if (userRaw.role === "PROFESIONAL") {
      const prof = await prisma.profesional.findUnique({
        where: { userId: id },
        select: { id: true, userId: true, especialidad: true, matricula: true },
      })
      if (prof) profesional = prof
    }

    const user = {
      ...userRaw,
      profesional,
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error("Error obteniendo usuario:", error)
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      nombre,
      email,
      password,
      dni,
      telefono,
      fechaNacimiento,
      direccion,
      obraSocial,
      obraSocialId,
      role,
    } = body

    // Verificar que el usuario existe
    const existingUser = await getUserById(id)

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    let profesional = null
    if (existingUser.role === "PROFESIONAL") {
      const prof = await prisma.profesional.findUnique({
        where: { userId: id },
        select: { id: true, userId: true, especialidad: true, matricula: true },
      })
      if (prof) profesional = prof
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== existingUser.email) {
      const emailUser = await getUserByEmail(email)
      if (emailUser && emailUser.id !== id) {
        return NextResponse.json(
          { error: "El email ya está en uso por otro usuario" },
          { status: 400 }
        )
      }
    }

    // Verificar si el DNI ya está en uso por otro usuario
    if (dni && dni !== existingUser.dni) {
      const dniUser = await getUserByDni(dni)
      if (dniUser && dniUser.id !== id) {
        return NextResponse.json(
          { error: "El DNI ya está en uso por otro usuario" },
          { status: 400 }
        )
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      nombre: nombre !== undefined ? nombre : existingUser.nombre,
      email: email !== undefined ? email : existingUser.email,
      telefono: telefono !== undefined ? telefono : existingUser.telefono,
      dni: dni !== undefined ? dni : existingUser.dni,
      direccion: direccion !== undefined ? direccion : existingUser.direccion,
      obraSocial: obraSocial !== undefined ? obraSocial : existingUser.obraSocial,
      obraSocialId: obraSocialId !== undefined ? obraSocialId : existingUser.obraSocialId,
      fechaNacimiento:
        fechaNacimiento !== undefined
          ? fechaNacimiento
            ? new Date(fechaNacimiento)
            : null
          : existingUser.fechaNacimiento,
    }

    // Si se proporciona una nueva contraseña, hashearla
    if (password && password.length > 0) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "La contraseña debe tener al menos 6 caracteres" },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      message: "Usuario actualizado exitosamente",
      user: updatedUser,
    })
  } catch (error: any) {
    console.error("Error actualizando usuario:", error)
    return NextResponse.json(
      { error: error.message || "Error al actualizar usuario" },
      { status: 500 }
    )
  }
}
