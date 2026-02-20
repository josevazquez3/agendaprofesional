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
  const dia = fecha.getUTCDay()
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

export const dynamic = "force-dynamic"

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

    // Normalizar la fecha: aceptar YYYY-MM-DD, DD/MM/YYYY o con T
    let fechaNormalizada = fecha.includes("T") ? fecha.split("T")[0] : fecha.trim()
    if (fechaNormalizada.includes("/")) {
      const partes = fechaNormalizada.split("/")
      if (partes.length === 3) {
        const [d, m, a] = partes
        fechaNormalizada = `${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
      }
    }
    const fechaObj = new Date(fechaNormalizada + "T12:00:00Z")

    if (isNaN(fechaObj.getTime())) {
      return NextResponse.json(
        { error: "Fecha inválida" },
        { status: 400 }
      )
    }

    const diaSemana = obtenerDiaSemana(fechaObj)

    const diaInicio = new Date(fechaNormalizada + "T00:00:00.000Z")
    const diaFin = new Date(fechaNormalizada + "T23:59:59.999Z")

    const horariosDisponiblesList = await prisma.horarioDisponible.findMany({
      where: { profesionalId, diaSemana, activo: true },
      select: { horaInicio: true, horaFin: true, duracionTurno: true },
    })
    const horariosDisponibles = horariosDisponiblesList.map((h) => ({
      horaInicio: h.horaInicio,
      horaFin: h.horaFin,
      duracionTurno: h.duracionTurno,
    }))

    const turnosOcupadosList = await prisma.turno.findMany({
      where: {
        profesionalId,
        fecha: { gte: diaInicio, lte: diaFin },
        estado: { in: ["PENDIENTE", "CONFIRMADO"] },
      },
      select: { hora: true },
    })
    const horasOcupadas = new Set(turnosOcupadosList.map((t) => t.hora))

    const bloqueosList = await prisma.bloqueoHorario.findMany({
      where: {
        horarioDisponible: { profesionalId },
        fecha: { gte: diaInicio, lte: diaFin },
      },
      select: { horaInicio: true, horaFin: true },
    })
    const bloqueos = bloqueosList.map((b) => ({ horaInicio: b.horaInicio, horaFin: b.horaFin }))

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
      turnosOcupados: turnosOcupadosList.length,
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
