import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserByEmail, getUserByDni } from "@/lib/user-helpers"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
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
      role = "PACIENTE",
    } = body

    // Validaciones básicas
    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const existingUser = await getUserByEmail(email)

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // Verificar si el DNI ya existe (si se proporciona)
    if (dni) {
      const existingDni = await getUserByDni(dni)

      if (existingDni) {
        return NextResponse.json(
          { error: "El DNI ya está registrado" },
          { status: 400 }
        )
      }
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        dni: dni || null,
        telefono: telefono || null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        direccion: direccion || null,
        obraSocial: obraSocial || null,
        role,
      },
    })

    return NextResponse.json(
      {
        message: "Usuario registrado exitosamente",
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error en registro:", error)
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    )
  }
}
