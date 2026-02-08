import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTurnos } from "@/lib/turno-helpers"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "SECRETARIA")
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Buscar todos los turnos completados usando helper
    const turnosCompletadosRaw = await getTurnos({
      estado: "COMPLETADO",
    })

    // Filtrar los que no tienen historia clínica
    const turnosSinHistoria = []
    for (const turno of turnosCompletadosRaw) {
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

        // Crear historia clínica básica
        await prisma.historiaClinica.create({
          data: {
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
        console.error(`Error creando historia clínica para turno ${turno.id}:`, error)
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
    console.error("Error migrando turnos:", error)
    return NextResponse.json(
      { error: error.message || "Error al migrar turnos" },
      { status: 500 }
    )
  }
}
