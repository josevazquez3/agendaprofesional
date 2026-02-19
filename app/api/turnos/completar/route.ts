import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTurnoById } from "@/lib/turno-helpers"
import { getActiveClinic } from "@/lib/clinic-context"
import { requireAuth, verifyProfessionalOwnership, createAuthErrorResponse } from "@/lib/auth-helpers"

export async function POST(request: Request) {
  try {
    // Validar autenticación básica
    const authResult = await requireAuth()

    if (!authResult || !authResult.allowed) {
      return authResult?.error || createAuthErrorResponse("UNAUTHORIZED")
    }

    const session = authResult.session

    const body = await request.json()
    const { turnoId, notas, diagnostico, tratamiento } = body

    if (!turnoId) {
      return NextResponse.json(
        { error: "ID de turno requerido" },
        { status: 400 }
      )
    }

    // Obtener turno usando helper
    const turno = await getTurnoById(turnoId)

    if (!turno) {
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 }
      )
    }

    // Verificar permisos: Solo profesionales pueden completar turnos (o admin/secretaria)
    if (session.user.role === "PROFESIONAL") {
      const hasOwnership = await verifyProfessionalOwnership(
        turno.profesionalId,
        session.user.id
      )
      
      if (!hasOwnership) {
        return createAuthErrorResponse("OWNERSHIP_REQUIRED", {
          message: "No tiene permisos para completar este turno. Solo puede completar sus propios turnos.",
        })
      }
    } else if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SECRETARIA"
    ) {
      return createAuthErrorResponse("FORBIDDEN", {
        message: "Solo profesionales, administradores y secretarias pueden completar turnos.",
      })
    }

    // Obtener clinicId del turno o de la clínica activa
    let clinicId: string | null = turno.clinicId || authResult.clinicId || null
    
    if (!clinicId) {
      try {
        const clinic = await getActiveClinic()
        if (clinic) {
          clinicId = clinic.id
        } else {
          // Intentar obtener la primera clínica del usuario
          const clinicUserResult = await prisma.clinicUser.findFirst({
            where: { userId: session.user.id, activo: true },
            select: { clinicId: true },
          })
          if (clinicUserResult) {
            clinicId = clinicUserResult.clinicId
          }
        }
      } catch (error) {
        // Log error pero continuar con validación
      }
    }
    
    if (!clinicId) {
      return createAuthErrorResponse("NO_CLINIC")
    }

    // Crear fecha de consulta basada en el turno
    const fechaConsulta = new Date(turno.fecha)
    fechaConsulta.setHours(
      parseInt(turno.hora.split(":")[0]),
      parseInt(turno.hora.split(":")[1]),
      0,
      0
    )

    // Verificar si ya existe una historia clínica para este turno
    let historiaExistente = null
    if (turno.id) {
      historiaExistente = await prisma.historiaClinica.findFirst({
        where: { turnoId: turno.id },
      })
    }

    // Usar transacción para asegurar atomicidad
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar turno
      const turnoCompletado = await tx.turno.update({
        where: { id: turnoId },
        data: {
          estado: "COMPLETADO",
        },
      })

      if (historiaExistente) {
        // Actualizar historia clínica existente
        const historiaActualizada = await tx.historiaClinica.update({
          where: { id: historiaExistente.id },
          data: {
            notas: notas || null,
            diagnostico: diagnostico || null,
            tratamiento: tratamiento || null,
            fechaConsulta,
          },
        })
        return { turno: turnoCompletado, historiaClinica: historiaActualizada, created: false }
      } else {
        // Crear nueva historia clínica
        const notasFinales = notas || turno.motivo || "Turno completado"
        
        const historiaCreada = await tx.historiaClinica.create({
          data: {
            clinicId,
            pacienteId: turno.pacienteId,
            profesionalId: turno.profesionalId,
            turnoId: turno.id,
            fechaConsulta,
            notas: notasFinales,
            diagnostico: diagnostico || null,
            tratamiento: tratamiento || null,
          },
        })
        return { turno: turnoCompletado, historiaClinica: historiaCreada, created: true }
      }
    })

    return NextResponse.json({
      message: "Turno marcado como completado",
      turno: resultado.turno,
      historiaClinicaCreada: resultado.created,
    })
  } catch (error: any) {
    // Log error para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.error("Error completando turno:", error)
    }
    
    // Manejar errores específicos de Prisma
    if (error.code === "P2025") {
      return createAuthErrorResponse("NOT_FOUND", {
        message: "El turno no existe o fue eliminado.",
      })
    }
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una historia clínica para este turno." },
        { status: 409 }
      )
    }
    
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Error de referencia: verifique que el turno, paciente o profesional existan." },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error.message || "Error al completar turno. Por favor, intente nuevamente." 
      },
      { status: 500 }
    )
  }
}
