import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTurnoById } from "@/lib/turno-helpers"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

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

    // Verificar permisos
    if (session.user.role === "PROFESIONAL") {
      // Obtener profesional del usuario
      const profesional = await prisma.$queryRawUnsafe<Array<{
        id: string
        userId: string
      }>>(
        `SELECT id, userId FROM Profesional WHERE userId = ? LIMIT 1`,
        session.user.id
      )
      if (
        profesional.length === 0 ||
        turno.profesionalId !== profesional[0].id
      ) {
        return NextResponse.json(
          { error: "No tiene permisos para completar este turno" },
          { status: 403 }
        )
      }
    }

    // Actualizar turno
    const turnoCompletado = await prisma.turno.update({
      where: { id: turnoId },
      data: {
        estado: "COMPLETADO",
      },
    })

    // Crear o actualizar historia clínica
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

    if (historiaExistente) {
      // Actualizar historia clínica existente
      await prisma.historiaClinica.update({
        where: { id: historiaExistente.id },
        data: {
          notas: notas || null,
          diagnostico: diagnostico || null,
          tratamiento: tratamiento || null,
          fechaConsulta,
        },
      })
    } else {
      // Crear nueva historia clínica
      // Si no hay notas pero el turno tiene motivo, usar el motivo como notas
      const notasFinales = notas || turno.motivo || "Turno completado"
      
      await prisma.historiaClinica.create({
        data: {
          pacienteId: turno.pacienteId,
          profesionalId: turno.profesionalId,
          turnoId: turno.id,
          fechaConsulta,
          notas: notasFinales,
          diagnostico: diagnostico || null,
          tratamiento: tratamiento || null,
        },
      })

      console.log(`Historia clínica creada para turno ${turno.id}, paciente ${turno.pacienteId}`)
    }

    return NextResponse.json({
      message: "Turno marcado como completado",
      turno: turnoCompletado,
      historiaClinicaCreada: true,
    })
  } catch (error: any) {
    console.error("Error completando turno:", error)
    return NextResponse.json(
      { error: error.message || "Error al completar turno" },
      { status: 500 }
    )
  }
}
