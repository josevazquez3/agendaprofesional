import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTurnos } from "@/lib/turno-helpers"
import { requireAuthWithRolesAndClinic, createAuthErrorResponse } from "@/lib/auth-helpers"

export async function POST(request: Request) {
  try {
    // Solo ADMIN y SECRETARIA pueden migrar
    const authResult = await requireAuthWithRolesAndClinic([
      "ADMIN",
      "SECRETARIA",
    ])

    if (!authResult || !authResult.allowed) {
      return authResult?.error || createAuthErrorResponse("UNAUTHORIZED")
    }

    const session = authResult.session
    const clinicId = authResult.clinicId!

    // Buscar todos los turnos completados usando helper
    const turnosCompletadosRaw = await getTurnos({
      estado: "COMPLETADO",
    })

    // Filtrar los que no tienen historia clínica y pertenecen a la clínica activa
    const turnosSinHistoria = []
    for (const turno of turnosCompletadosRaw) {
      // Solo migrar turnos de la clínica activa
      if (turno.clinicId !== clinicId) {
        continue
      }
      
      const tieneHistoria = await prisma.$queryRawUnsafe<Array<{
        id: string
      }>>(
        `SELECT id FROM HistoriaClinica WHERE turnoId = ? LIMIT 1`,
        turno.id
      )
      if (tieneHistoria.length === 0) {
        turnosSinHistoria.push(turno)
      }
    }

    const turnosCompletados = turnosSinHistoria

    let creados = 0
    let errores = 0

    for (const turno of turnosCompletados) {
      try {
        // Crear fecha de consulta combinando fecha y hora del turno
        const fechaConsulta = new Date(turno.fecha)
        const [horas, minutos] = turno.hora.split(":").map(Number)
        fechaConsulta.setHours(horas, minutos, 0, 0)

        // Crear historia clínica básica con clinicId
        await prisma.historiaClinica.create({
          data: {
            clinicId,
            pacienteId: turno.pacienteId,
            profesionalId: turno.profesionalId,
            turnoId: turno.id,
            fechaConsulta,
            notas: turno.motivo || "Turno completado sin observaciones",
            diagnostico: null,
            tratamiento: null,
          },
        })
        creados++
      } catch (error: any) {
        // Log error solo en desarrollo
        if (process.env.NODE_ENV === "development") {
          console.error(`Error creando historia clínica para turno ${turno.id}:`, error)
        }
        errores++
      }
    }

    return NextResponse.json({
      message: `Migración completada: ${creados} registros creados, ${errores} errores`,
      creados,
      errores,
      total: turnosCompletados.length,
    })
  } catch (error: any) {
    // Log error solo en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.error("Error migrando turnos:", error)
    }
    
    return NextResponse.json(
      { error: error.message || "Error al migrar turnos. Por favor, intente nuevamente." },
      { status: 500 }
    )
  }
}
