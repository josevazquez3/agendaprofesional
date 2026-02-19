import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

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

    const horariosDisponiblesList = await prisma.horarioDisponible.findMany({
      where: { profesionalId, activo: true },
      select: {
        id: true,
        profesionalId: true,
        diaSemana: true,
        horaInicio: true,
        horaFin: true,
        duracionTurno: true,
      },
    })

    if (horariosDisponiblesList.length === 0) {
      return NextResponse.json({
        diasDisponibles: {},
      })
    }

    const horariosDisponibles = horariosDisponiblesList.map((h) => ({
      id: h.id,
      profesionalId: h.profesionalId,
      diaSemana: h.diaSemana,
      horaInicio: h.horaInicio,
      horaFin: h.horaFin,
      duracionTurno: h.duracionTurno,
      activo: true,
    }))

    const now = new Date()
    const hoyKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

    let fechaInicio: Date
    let fechaFin: Date

    if (mes && anio) {
      fechaInicio = new Date(parseInt(anio), parseInt(mes) - 1, 1, 0, 0, 0, 0)
      fechaFin = new Date(parseInt(anio), parseInt(mes), 0, 23, 59, 59, 999)
    } else {
      const y = now.getFullYear()
      const m = now.getMonth()
      fechaInicio = new Date(y, m, 1, 0, 0, 0, 0)
      fechaFin = new Date(y, m + 2, 0, 23, 59, 59, 999)
    }

    const fechaFinEnd = new Date(fechaFin)
    fechaFinEnd.setHours(23, 59, 59, 999)

    const turnosOcupadosList = await prisma.turno.findMany({
      where: {
        profesionalId,
        fecha: { gte: fechaInicio, lte: fechaFinEnd },
        estado: { in: ["PENDIENTE", "CONFIRMADO"] },
      },
      select: { fecha: true, hora: true },
    })

    const toFechaKey = (d: Date) => {
      const x = d instanceof Date ? d : new Date(d)
      return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`
    }
    const turnosOcupadosPorFecha = new Map<string, Set<string>>()
    turnosOcupadosList.forEach((t) => {
      const fechaKey = toFechaKey(t.fecha)
      if (!turnosOcupadosPorFecha.has(fechaKey)) turnosOcupadosPorFecha.set(fechaKey, new Set())
      turnosOcupadosPorFecha.get(fechaKey)!.add(t.hora)
    })

    const bloqueosList = await prisma.bloqueoHorario.findMany({
      where: {
        horarioDisponible: { profesionalId },
        fecha: { gte: fechaInicio, lte: fechaFinEnd },
      },
      select: { fecha: true, horaInicio: true, horaFin: true },
    })

    const bloqueosPorFecha = new Map<string, Array<{ inicio: string; fin: string }>>()
    bloqueosList.forEach((b) => {
      const fechaKey = toFechaKey(b.fecha)
      if (!bloqueosPorFecha.has(fechaKey)) bloqueosPorFecha.set(fechaKey, [])
      bloqueosPorFecha.get(fechaKey)!.push({ inicio: b.horaInicio, fin: b.horaFin })
    })

    // Generar días disponibles: claves YYYY-MM-DD en hora local del servidor (igual que el cliente)
    const diasDisponibles: Record<string, string[]> = {}
    const fechaActual = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate(), 0, 0, 0, 0)

    while (fechaActual <= fechaFin) {
      const year = fechaActual.getFullYear()
      const month = fechaActual.getMonth() + 1
      const day = fechaActual.getDate()
      const fechaKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`

      if (fechaKey < hoyKey) {
        fechaActual.setDate(fechaActual.getDate() + 1)
        continue
      }

      const diaSemana = obtenerDiaSemana(fechaActual)
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
            if (horasOcupadas.has(hora)) continue
            const estaBloqueado = bloqueosDelDia.some((b) => hora >= b.inicio && hora < b.fin)
            if (!estaBloqueado) horariosDisponiblesDelDia.push(hora)
          }
        }
        diasDisponibles[fechaKey] = horariosDisponiblesDelDia.sort()
      }

      fechaActual.setDate(fechaActual.getDate() + 1)
    }

    return NextResponse.json({
      diasDisponibles,
    })
  } catch (error: any) {
    console.error("Error obteniendo días disponibles:", error?.message)
    return NextResponse.json(
      { 
        error: "Error al obtener días disponibles",
        details: error?.message || String(error)
      },
      { status: 500 }
    )
  }
}
