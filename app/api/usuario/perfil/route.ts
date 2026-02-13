import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        dni: true,
        fechaNacimiento: true,
        direccion: true,
        fotoPerfil: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      ...user,
      fechaNacimiento: user.fechaNacimiento?.toISOString().split("T")[0] ?? null,
    })
  } catch (error: any) {
    console.error("Error obteniendo perfil:", error)
    return NextResponse.json(
      { error: "Error al obtener perfil" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, email, telefono, dni, fechaNacimiento, direccion, fotoPerfil } = body

    if (email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: String(email).trim().toLowerCase(),
          id: { not: session.user.id },
        },
      })
      if (existing) {
        return NextResponse.json(
          { error: "Ya existe un usuario con ese email" },
          { status: 400 }
        )
      }
    }

    if (dni !== undefined && dni !== null && dni !== "") {
      const existingDni = await prisma.user.findFirst({
        where: {
          dni: String(dni).trim(),
          id: { not: session.user.id },
        },
      })
      if (existingDni) {
        return NextResponse.json(
          { error: "Ya existe un usuario con ese DNI" },
          { status: 400 }
        )
      }
    }

    const data: Record<string, unknown> = {}
    if (nombre !== undefined) data.nombre = String(nombre).trim()
    if (email !== undefined) data.email = String(email).trim().toLowerCase()
    if (telefono !== undefined) data.telefono = telefono ? String(telefono).trim() : null
    if (dni !== undefined) data.dni = dni ? String(dni).trim() : null
    if (fechaNacimiento !== undefined) {
      data.fechaNacimiento = fechaNacimiento ? new Date(fechaNacimiento) : null
    }
    if (direccion !== undefined) data.direccion = direccion ? String(direccion).trim() : null
    if (fotoPerfil !== undefined) data.fotoPerfil = fotoPerfil ? String(fotoPerfil) : null

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: data as any,
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        dni: true,
        fechaNacimiento: true,
        direccion: true,
        fotoPerfil: true,
        role: true,
      },
    })

    return NextResponse.json({
      message: "Perfil actualizado correctamente",
      user: {
        ...updated,
        fechaNacimiento: updated.fechaNacimiento?.toISOString().split("T")[0] ?? null,
      },
    })
  } catch (error: any) {
    console.error("Error actualizando perfil:", error)
    return NextResponse.json(
      { error: error.message || "Error al actualizar perfil" },
      { status: 500 }
    )
  }
}
