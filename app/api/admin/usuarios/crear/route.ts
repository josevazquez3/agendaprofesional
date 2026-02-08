import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserByEmail, getUserByDni } from "@/lib/user-helpers"
import bcrypt from "bcryptjs"
import { logCreate } from "@/lib/audit-service"
import { getActiveClinic } from "@/lib/clinic-context"

export async function POST(request: Request) {
  try {
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
      especialidad,
      matricula,
      atiendeObraSocial,
    } = body

    // Validaciones
    if (!nombre || !email || !password || !role) {
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
        obraSocialId: obraSocialId || null,
        role,
      },
    })

    // Si es profesional, crear el registro profesional
    if (role === "PROFESIONAL" && especialidad) {
      await prisma.profesional.create({
        data: {
          userId: user.id,
          especialidad,
          matricula: matricula || null,
          atiendeObraSocial: atiendeObraSocial !== false,
        },
      })
    }

    // Registrar auditoría (no bloquea si falla)
    try {
      const clinic = await getActiveClinic()
      if (clinic) {
        await logCreate(
          clinic.id,
          session.user.id,
          "USER",
          user.id,
          {
            nombre: user.nombre,
            email: user.email,
            role: user.role,
            dni: user.dni,
            telefono: user.telefono,
          },
          request as any
        )
      }
    } catch (auditError) {
      console.error("Error registrando auditoría:", auditError)
      // No lanzar error, solo registrar
    }

    return NextResponse.json(
      {
        message: "Usuario creado exitosamente",
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creando usuario:", error)
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    )
  }
}
