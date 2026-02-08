import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const DIAS_SEMANA: Record<number, string> = {
  0: "DOMINGO",
  1: "LUNES",
  2: "MARTES",
  3: "MIERCOLES",
  4: "JUEVES",
  5: "VIERNES",
  6: "SABADO",
}

function obtenerDiaSemana(fecha: Date): string {
  const dia = fecha.getDay()
  return DIAS_SEMANA[dia]
}

function generarHorarios(horaInicio: string, horaFin: string, duracion: number): string[] {
  const horarios: string[] = []
  const [inicioH, inicioM] = horaInicio.split(":").map(Number)
  const [finH, finM] = horaFin.split(":").map(Number)

  let horaActual = inicioH * 60 + inicioM
  const finTotal = finH * 60 + finM

  while (horaActual + duracion <= finTotal) {
    const horas = Math.floor(horaActual / 60)
    const minutos = horaActual % 60
    horarios.push(`${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`)
    horaActual += duracion
  }

  return horarios
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const profesionalId = searchParams.get("profesionalId")
    const fecha = searchParams.get("fecha")

    if (!profesionalId || !fecha) {
      return NextResponse.json(
        { error: "profesionalId y fecha son requeridos" },
        { status: 400 }
      )
    }

    // Normalizar la fecha (puede venir con o sin hora)
    const fechaNormalizada = fecha.includes('T') ? fecha.split('T')[0] : fecha
    const fechaObj = new Date(fechaNormalizada + 'T00:00:00')
    
    // Validar que la fecha sea válida
    if (isNaN(fechaObj.getTime())) {
      return NextResponse.json(
        { error: "Fecha inválida" },
        { status: 400 }
      )
    }
    
    const diaSemana = obtenerDiaSemana(fechaObj)

    // Obtener horarios disponibles del profesional para ese día
    const horariosDisponibles = await prisma.horarioDisponible.findMany({
      where: {
        profesionalId,
        diaSemana,
        activo: true,
      },
    })

    // Obtener turnos ya ocupados para esa fecha usando SQL raw
    const fechaStr = fechaNormalizada
    const turnosOcupadosRaw = await prisma.$queryRawUnsafe<Array<{
      hora: string
    }>>(
      `SELECT hora FROM Turno 
       WHERE profesionalId = ? 
         AND date(fecha) = date(?)
         AND estado IN ('PENDIENTE', 'CONFIRMADO')`,
      profesionalId,
      fechaStr
    )
    const turnosOcupados = turnosOcupadosRaw.map((t) => ({ hora: t.hora }))

    const horasOcupadas = new Set(turnosOcupados.map((t) => t.hora))

    // Obtener bloqueos para esa fecha
    const bloqueos = await prisma.bloqueoHorario.findMany({
      where: {
        horarioDisponible: {
          profesionalId,
        },
        fecha: fechaObj,
      },
      include: {
        horarioDisponible: true,
      },
    })

    // Generar lista de horarios disponibles
    const horarios: string[] = []

    for (const horario of horariosDisponibles) {
      const horariosGenerados = generarHorarios(
        horario.horaInicio,
        horario.horaFin,
        horario.duracionTurno
      )

      for (const hora of horariosGenerados) {
        // Verificar si está ocupado
        if (horasOcupadas.has(hora)) {
          continue
        }

        // Verificar si está bloqueado
        const estaBloqueado = bloqueos.some((bloqueo) => {
          const bloqueoInicio = bloqueo.horaInicio
          const bloqueoFin = bloqueo.horaFin
          return hora >= bloqueoInicio && hora < bloqueoFin
        })

        if (!estaBloqueado) {
          horarios.push(hora)
        }
      }
    }

    return NextResponse.json({
      horarios: horarios.sort(),
      fecha: fechaNormalizada,
      diaSemana,
      profesionalId,
      totalHorariosConfigurados: horariosDisponibles.length,
      turnosOcupados: turnosOcupadosRaw.length,
      bloqueos: bloqueos.length,
    })
  } catch (error) {
    console.error("Error obteniendo horarios disponibles:", error)
    return NextResponse.json(
      { error: "Error al obtener horarios disponibles" },
      { status: 500 }
    )
  }
}
