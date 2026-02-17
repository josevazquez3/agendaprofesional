import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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

    const emailNormalized = String(email).trim().toLowerCase()

    // Verificar si el email ya existe (solo Prisma, sin SMTP ni envío de correo)
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // Verificar si el DNI ya existe (si se proporciona)
    if (dni && String(dni).trim()) {
      const existingDni = await prisma.user.findFirst({
        where: { dni: String(dni).trim() },
      })
      if (existingDni) {
        return NextResponse.json(
          { error: "El DNI ya está registrado" },
          { status: 400 }
        )
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        nombre: String(nombre).trim(),
        email: emailNormalized,
        password: hashedPassword,
        dni: dni && String(dni).trim() ? String(dni).trim() : null,
        telefono: telefono ? String(telefono).trim() : null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        direccion: direccion ? String(direccion).trim() : null,
        obraSocial: obraSocial ? String(obraSocial).trim() : null,
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
  } catch (error: unknown) {
    console.error("Error en registro:", error)
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    )
  }
}
