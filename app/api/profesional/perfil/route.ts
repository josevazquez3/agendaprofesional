import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserByEmail, getUserByDni } from "@/lib/user-helpers"
import { getProfesionalByUserId } from "@/lib/profesional-helpers"

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "PROFESIONAL") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener el profesional del usuario actual
    const profesional = await getProfesionalByUserId(session.user.id)

    if (!profesional) {
      return NextResponse.json(
        { error: "Profesional no encontrado" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { 
      nombre, 
      email, 
      telefono, 
      dni, 
      especialidad, 
      matricula, 
      atiendeObraSocial,
      fotoPerfil
    } = body

    // Obtener el usuario actual para comparar
    const usuarioActual = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!usuarioActual) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== usuarioActual.email) {
      const emailUser = await getUserByEmail(email)
      if (emailUser && emailUser.id !== session.user.id) {
        return NextResponse.json(
          { error: "El email ya está en uso por otro usuario" },
          { status: 400 }
        )
      }
    }

    // Verificar si el DNI ya está en uso por otro usuario
    if (dni && dni !== usuarioActual.dni) {
      const dniUser = await getUserByDni(dni)
      if (dniUser && dniUser.id !== session.user.id) {
        return NextResponse.json(
          { error: "El DNI ya está en uso por otro usuario" },
          { status: 400 }
        )
      }
    }

    // Verificar si la matrícula ya está en uso por otro profesional
    if (matricula && matricula !== profesional.matricula) {
      const matriculaExists = await prisma.profesional.findFirst({
        where: {
          matricula,
          id: {
            not: profesional.id,
          },
        },
      })

      if (matriculaExists) {
        return NextResponse.json(
          { error: "La matrícula ya está en uso por otro profesional" },
          { status: 400 }
        )
      }
    }

    // Actualizar usuario
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        nombre: nombre || usuarioActual.nombre,
        email: email || usuarioActual.email,
        telefono: telefono !== undefined ? telefono : usuarioActual.telefono,
        dni: dni !== undefined ? dni : usuarioActual.dni,
        fotoPerfil: fotoPerfil !== undefined ? fotoPerfil : usuarioActual.fotoPerfil,
      },
    })

    // Actualizar profesional
    const profesionalActualizado = await prisma.profesional.update({
      where: { id: profesional.id },
      data: {
        especialidad: especialidad || profesional.especialidad,
        matricula: matricula !== undefined ? matricula : profesional.matricula,
        atiendeObraSocial:
          atiendeObraSocial !== undefined
            ? atiendeObraSocial
            : profesional.atiendeObraSocial,
      },
      include: {
        user: {
          select: {
            nombre: true,
            email: true,
            telefono: true,
            dni: true,
            fotoPerfil: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: "Perfil actualizado exitosamente",
      profesional: profesionalActualizado,
    })
  } catch (error: any) {
    console.error("Error actualizando perfil del profesional:", error)
    return NextResponse.json(
      { error: error.message || "Error al actualizar perfil" },
      { status: 500 }
    )
  }
}
