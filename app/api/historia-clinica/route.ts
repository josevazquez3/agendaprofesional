import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProfesionalByUserId } from "@/lib/profesional-helpers"
import { getActiveClinic } from "@/lib/clinic-context"
import { requireAuthWithRolesAndClinic, createAuthErrorResponse } from "@/lib/auth-helpers"

export async function POST(request: Request) {
  try {
    // Validar autenticación, roles y clínica activa
    const authResult = await requireAuthWithRolesAndClinic([
      "ADMIN",
      "SECRETARIA",
      "PROFESIONAL",
    ])

    if (!authResult || !authResult.allowed) {
      return authResult?.error || createAuthErrorResponse("UNAUTHORIZED")
    }

    const session = authResult.session
    const clinicId = authResult.clinicId!

    const body = await request.json()
    const {
      pacienteId,
      profesionalId,
      notas,
      diagnostico,
      tratamiento,
      turnoId,
      fechaConsulta: fechaConsultaBody,
      estudios,
    } = body

    if (!pacienteId) {
      return NextResponse.json(
        { error: "pacienteId es requerido" },
        { status: 400 }
      )
    }

    // Determinar el profesionalId según el rol
    let profesionalIdFinal = profesionalId

    if (session.user.role === "PROFESIONAL") {
      // Si es profesional, usar su propio ID
      const profesional = await getProfesionalByUserId(session.user.id)
      if (!profesional) {
        return NextResponse.json(
          { error: "Profesional no encontrado" },
          { status: 404 }
        )
      }
      profesionalIdFinal = profesional.id
    } else if (!profesionalIdFinal) {
      // Si es ADMIN o SECRETARIA y no se especifica profesionalId, devolver error
      return NextResponse.json(
        { error: "profesionalId es requerido" },
        { status: 400 }
      )
    }

    // Verificar que el paciente existe
    const paciente = await prisma.user.findUnique({
      where: { id: pacienteId },
    })

    if (!paciente || paciente.role !== "PACIENTE") {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que el profesional existe
    const profesional = await prisma.profesional.findUnique({
      where: { id: profesionalIdFinal },
    })

    if (!profesional) {
      return NextResponse.json(
        { error: "Profesional no encontrado" },
        { status: 404 }
      )
    }

    // Validar turnoId si se proporciona
    if (turnoId) {
      const turno = await prisma.turno.findUnique({
        where: { id: turnoId },
        select: { 
          clinicId: true,
          pacienteId: true,
          profesionalId: true,
        },
      })
      
      if (!turno) {
        return createAuthErrorResponse("NOT_FOUND", {
          message: "El turno especificado no existe.",
        })
      }
      
      // Verificar que el turno pertenece a la misma clínica
      if (turno.clinicId !== clinicId) {
        return createAuthErrorResponse("FORBIDDEN", {
          message: "El turno especificado no pertenece a su clínica activa.",
        })
      }
      
      // Verificar que el turno corresponde al paciente y profesional correctos
      if (turno.pacienteId !== pacienteId) {
        return NextResponse.json(
          { error: "El turno especificado no corresponde al paciente seleccionado." },
          { status: 400 }
        )
      }
      
      if (turno.profesionalId !== profesionalIdFinal) {
        return NextResponse.json(
          { error: "El turno especificado no corresponde al profesional seleccionado." },
          { status: 400 }
        )
      }
    }

    // Fecha de consulta: la envía el cliente (agregar manual) o ahora (evolución desde turno)
    const fechaConsulta = fechaConsultaBody
      ? new Date(fechaConsultaBody)
      : new Date()

    // Usuario que crea el registro (auditoría) cuando el admin agrega manualmente (fechaConsulta enviada)
    const creadoPorId =
      session.user.role === "ADMIN" && fechaConsultaBody ? session.user.id : null

    const historiaClinica = await prisma.$transaction(async (tx) => {
      const created = await tx.historiaClinica.create({
        data: {
          clinicId,
          pacienteId,
          profesionalId: profesionalIdFinal,
          turnoId: turnoId || null,
          fechaConsulta,
          notas: notas || null,
          diagnostico: diagnostico || null,
          tratamiento: tratamiento || null,
          creadoPorId: creadoPorId || undefined,
        },
        include: {
          profesional: {
            select: {
              id: true,
              especialidad: true,
              user: {
                select: {
                  nombre: true,
                },
              },
            },
          },
          turno: {
            select: {
              fecha: true,
              hora: true,
              estado: true,
            },
          },
        },
      })

      // Adjuntos (estudios): PDF, DOCX, etc.
      if (estudios && Array.isArray(estudios)) {
        for (const estudio of estudios) {
          if (estudio.nombreArchivo) {
            const contenido = estudio.contenido || ""
            await tx.archivoHistoriaClinica.create({
              data: {
                historiaClinicaId: created.id,
                nombreArchivo: estudio.nombreArchivo,
                tipoArchivo: estudio.tipoArchivo || "TEXTO",
                urlArchivo: contenido.startsWith("data:")
                  ? contenido
                  : `data:text/plain;base64,${Buffer.from(contenido).toString("base64")}`,
                tamano: contenido.length,
              },
            })
          }
        }
      }

      return created
    })

    return NextResponse.json(
      {
        message: "Historia clínica creada exitosamente",
        historiaClinica,
      },
      { status: 201 }
    )
  } catch (error: any) {
    // Log error para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.error("Error creando historia clínica:", error)
    }
    
    // Manejar errores específicos de Prisma
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una historia clínica para este turno." },
        { status: 409 }
      )
    }
    
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Error de referencia: verifique que el paciente, profesional o turno existan." },
        { status: 400 }
      )
    }
    
    if (error.code === "P2011") {
      return createAuthErrorResponse("NO_CLINIC")
    }
    
    return NextResponse.json(
      { 
        error: error.message || "Error al crear historia clínica. Por favor, intente nuevamente." 
      },
      { status: 500 }
    )
  }
}
