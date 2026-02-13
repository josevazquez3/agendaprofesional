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

    // Obtener o crear clínica activa (requerida para profesionales)
    let clinic = await getActiveClinic()
    
    // Si no hay clínica activa, intentar obtener o crear una por defecto
    if (!clinic) {
      // Intentar obtener la primera clínica disponible
      const primeraClinic = await prisma.clinic.findFirst({
        where: { activo: true },
        select: {
          id: true,
          nombre: true,
          slug: true,
          logo: true,
          colorPrimary: true,
        },
      })
      
      if (primeraClinic) {
        clinic = primeraClinic
        
        // Asociar el usuario ADMIN actual a esta clínica si no está asociado
        const existingClinicUser = await prisma.clinicUser.findUnique({
          where: {
            clinicId_userId: {
              clinicId: clinic.id,
              userId: session.user.id,
            },
          },
        })
        
        if (!existingClinicUser) {
          await prisma.clinicUser.create({
            data: {
              clinicId: clinic.id,
              userId: session.user.id,
              role: "ADMIN",
              activo: true,
            },
          })
        }
      } else {
        // Crear una clínica por defecto si no existe ninguna
        try {
          const nuevaClinic = await prisma.clinic.create({
            data: {
              nombre: "Clínica Principal",
              slug: "default",
              activo: true,
              colorPrimary: "#2563EB",
            },
            select: {
              id: true,
              nombre: true,
              slug: true,
              logo: true,
              colorPrimary: true,
            },
          })
          
          clinic = nuevaClinic
          
          // Asociar el usuario ADMIN actual a la nueva clínica
          await prisma.clinicUser.create({
            data: {
              clinicId: clinic.id,
              userId: session.user.id,
              role: "ADMIN",
              activo: true,
            },
          })
          
          console.log("Clínica por defecto creada:", clinic.id)
        } catch (createError: any) {
          console.error("Error creando clínica por defecto:", createError)
          return NextResponse.json(
            { 
              error: "No se pudo crear una clínica por defecto. Por favor, contacte al administrador del sistema.",
              details: process.env.NODE_ENV === "development" ? createError.message : undefined
            },
            { status: 500 }
          )
        }
      }
    }
    
    // Verificar que tenemos una clínica válida
    if (!clinic) {
      return NextResponse.json(
        { error: "No se pudo determinar la clínica activa. Por favor, contacte al administrador del sistema." },
        { status: 500 }
      )
    }

    // Validar campos específicos para profesionales
    if (role === "PROFESIONAL") {
      if (!especialidad || especialidad.trim() === "") {
        return NextResponse.json(
          { error: "La especialidad es requerida para profesionales" },
          { status: 400 }
        )
      }
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario
    let user
    try {
      user = await prisma.user.create({
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
    } catch (dbError: any) {
      console.error("Error creando usuario en DB:", dbError)
      
      // Manejar errores específicos de Prisma
      if (dbError.code === "P2002") {
        const field = dbError.meta?.target?.[0]
        if (field === "email") {
          return NextResponse.json(
            { error: "El email ya está registrado" },
            { status: 400 }
          )
        }
        if (field === "dni") {
          return NextResponse.json(
            { error: "El DNI ya está registrado" },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: `El campo ${field} ya está en uso` },
          { status: 400 }
        )
      }
      
      throw dbError
    }

    // Si es profesional, crear el registro profesional
    if (role === "PROFESIONAL" && especialidad) {
      try {
        // Verificar si la matrícula ya existe (si se proporciona)
        if (matricula) {
          const existingMatricula = await prisma.profesional.findUnique({
            where: { matricula },
          })
          
          if (existingMatricula) {
            // Eliminar el usuario creado si falla la creación del profesional
            await prisma.user.delete({ where: { id: user.id } })
            return NextResponse.json(
              { error: "La matrícula ya está registrada" },
              { status: 400 }
            )
          }
        }

        await prisma.profesional.create({
          data: {
            userId: user.id,
            clinicId: clinic.id,
            especialidad: especialidad.trim(),
            matricula: matricula?.trim() || null,
            atiendeObraSocial: atiendeObraSocial !== false,
          },
        })
      } catch (profError: any) {
        console.error("Error creando profesional:", profError)
        
        // Eliminar el usuario creado si falla la creación del profesional
        try {
          await prisma.user.delete({ where: { id: user.id } })
        } catch (deleteError) {
          console.error("Error eliminando usuario después de fallo:", deleteError)
        }
        
        if (profError.code === "P2002") {
          const field = profError.meta?.target?.[0]
          if (field === "matricula") {
            return NextResponse.json(
              { error: "La matrícula ya está registrada" },
              { status: 400 }
            )
          }
        }
        
        throw new Error(`Error al crear el registro profesional: ${profError.message || "Error desconocido"}`)
      }
    }

    // Registrar auditoría (no bloquea si falla)
    try {
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
    
    // Proporcionar mensajes de error más específicos
    let errorMessage = "Error al crear usuario"
    
    if (error.message) {
      errorMessage = error.message
    } else if (error.code) {
      // Errores de Prisma
      switch (error.code) {
        case "P2002":
          errorMessage = "Ya existe un registro con estos datos"
          break
        case "P2003":
          errorMessage = "Error de referencia: datos relacionados no encontrados"
          break
        case "P2025":
          errorMessage = "Registro no encontrado"
          break
        default:
          errorMessage = `Error de base de datos: ${error.code}`
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
