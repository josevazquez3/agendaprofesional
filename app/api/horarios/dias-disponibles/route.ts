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
    const mes = searchParams.get("mes") // YYYY-MM
    const anio = searchParams.get("anio")

    if (!profesionalId) {
      return NextResponse.json(
        { error: "profesionalId es requerido" },
        { status: 400 }
      )
    }

    // Obtener horarios disponibles del profesional
    const horariosDisponibles = await prisma.horarioDisponible.findMany({
      where: {
        profesionalId,
        activo: true,
      },
    })

    if (horariosDisponibles.length === 0) {
      return NextResponse.json({
        diasDisponibles: {},
      })
    }

    // Determinar el rango de fechas a verificar
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    let fechaInicio: Date
    let fechaFin: Date
    
    if (mes && anio) {
      fechaInicio = new Date(parseInt(anio), parseInt(mes) - 1, 1)
      fechaFin = new Date(parseInt(anio), parseInt(mes), 0) // Último día del mes
    } else {
      // Por defecto, mostrar el mes actual y el siguiente
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0)
    }

    fechaInicio.setHours(0, 0, 0, 0)
    fechaFin.setHours(23, 59, 59, 999)

    // Obtener turnos ocupados en el rango usando SQL raw
    const fechaInicioStr = fechaInicio.toISOString().split('T')[0]
    const fechaFinStr = fechaFin.toISOString().split('T')[0]
    
    const turnosOcupadosRaw = await prisma.$queryRawUnsafe<Array<{
      fecha: string
      hora: string
    }>>(
      `SELECT date(fecha) as fecha, hora FROM Turno 
       WHERE profesionalId = ? 
         AND date(fecha) >= date(?)
         AND date(fecha) <= date(?)
         AND estado IN ('PENDIENTE', 'CONFIRMADO')`,
      profesionalId,
      fechaInicioStr,
      fechaFinStr
    )

    // Crear un mapa de turnos ocupados por fecha
    const turnosOcupadosPorFecha = new Map<string, Set<string>>()
    turnosOcupadosRaw.forEach((t) => {
      const fechaKey = t.fecha.toString().split('T')[0]
      if (!turnosOcupadosPorFecha.has(fechaKey)) {
        turnosOcupadosPorFecha.set(fechaKey, new Set())
      }
      turnosOcupadosPorFecha.get(fechaKey)!.add(t.hora)
    })

    // Obtener bloqueos en el rango
    const bloqueosRaw = await prisma.$queryRawUnsafe<Array<{
      fecha: string
      horaInicio: string
      horaFin: string
    }>>(
      `SELECT date(b.fecha) as fecha, b.horaInicio, b.horaFin
       FROM BloqueoHorario b
       INNER JOIN HorarioDisponible h ON b.horarioDisponibleId = h.id
       WHERE h.profesionalId = ?
         AND date(b.fecha) >= date(?)
         AND date(b.fecha) <= date(?)`,
      profesionalId,
      fechaInicioStr,
      fechaFinStr
    )

    // Crear un mapa de bloqueos por fecha
    const bloqueosPorFecha = new Map<string, Array<{ inicio: string; fin: string }>>()
    bloqueosRaw.forEach((b) => {
      const fechaKey = b.fecha.toString().split('T')[0]
      if (!bloqueosPorFecha.has(fechaKey)) {
        bloqueosPorFecha.set(fechaKey, [])
      }
      bloqueosPorFecha.get(fechaKey)!.push({
        inicio: b.horaInicio,
        fin: b.horaFin,
      })
    })

    // Generar días disponibles con sus horarios
    const diasDisponibles: Record<string, string[]> = {}
    const fechaActual = new Date(fechaInicio)

    while (fechaActual <= fechaFin) {
      // Solo considerar fechas futuras o de hoy
      if (fechaActual < hoy) {
        fechaActual.setDate(fechaActual.getDate() + 1)
        continue
      }

      const diaSemana = obtenerDiaSemana(fechaActual)
      const fechaKey = fechaActual.toISOString().split('T')[0]

      // Buscar horarios configurados para este día de la semana
      const horariosDelDia = horariosDisponibles.filter((h) => h.diaSemana === diaSemana)

      if (horariosDelDia.length > 0) {
        const horariosDisponiblesDelDia: string[] = []
        const horasOcupadas = turnosOcupadosPorFecha.get(fechaKey) || new Set()
        const bloqueosDelDia = bloqueosPorFecha.get(fechaKey) || []

        for (const horario of horariosDelDia) {
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
            const estaBloqueado = bloqueosDelDia.some((bloqueo) => {
              return hora >= bloqueo.inicio && hora < bloqueo.fin
            })

            if (!estaBloqueado) {
              horariosDisponiblesDelDia.push(hora)
            }
          }
        }

        // Solo agregar el día si tiene horarios disponibles
        if (horariosDisponiblesDelDia.length > 0) {
          diasDisponibles[fechaKey] = horariosDisponiblesDelDia.sort()
        }
      }

      fechaActual.setDate(fechaActual.getDate() + 1)
    }

    return NextResponse.json({
      diasDisponibles,
    })
  } catch (error) {
    console.error("Error obteniendo días disponibles:", error)
    return NextResponse.json(
      { error: "Error al obtener días disponibles" },
      { status: 500 }
    )
  }
}
