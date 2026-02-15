/**
 * Helpers para consultas de Turno usando SQL raw
 * Evita problemas con schema desincronizado
 */

import { prisma } from "./prisma"

/**
 * Helper para convertir valores de fecha (BigInt, string, number) a Date de forma segura
 */
function safeDate(value: string | bigint | number | null | undefined): Date | null {
  if (!value) return null
  if (typeof value === 'bigint') {
    return new Date(Number(value))
  }
  if (typeof value === 'number') {
    return new Date(value)
  }
  return new Date(value)
}

export interface TurnoWithRelations {
  id: string
  pacienteId: string
  profesionalId: string
  fecha: Date
  hora: string
  estado: string
  motivo: string | null
  codigoTurno: string
  clinicId?: string | null
  consultorioProfesionalId?: string | null
  motivoEliminacion?: string | null
  eliminadoAt?: Date | null
  eliminadoPor?: { nombre: string }
  paciente?: {
    nombre: string
    email: string
  }
  profesional?: {
    id: string
    especialidad?: string
    user?: {
      id?: string
      nombre: string
      email?: string
    }
  }
}

/**
 * Obtener turnos del día con relaciones
 */
export async function getTurnosDelDia(
  fechaInicio: Date,
  fechaFin: Date,
  limit?: number
): Promise<TurnoWithRelations[]> {
  try {
    // Normalizar fechas para SQLite
    const fechaInicioStr = fechaInicio.toISOString().split('T')[0]
    const fechaFinStr = fechaFin.toISOString().split('T')[0]

    // Consulta SQL raw para obtener turnos
    const turnos = await prisma.$queryRawUnsafe<Array<{
      id: string
      pacienteId: string
      profesionalId: string
      fecha: string | bigint | number
      hora: string
      estado: string
      motivo: string | null
      codigoTurno: string
      clinicId: string | null
    }>>(
      `SELECT id, pacienteId, profesionalId, fecha, hora, estado, motivo, codigoTurno, clinicId
       FROM Turno
       WHERE date(fecha) >= date(?) AND date(fecha) < date(?)
       ORDER BY hora ASC
       ${limit ? `LIMIT ${limit}` : ''}`,
      fechaInicioStr,
      fechaFinStr
    )

    if (turnos.length === 0) {
      return []
    }

    // Obtener IDs únicos
    const pacienteIds = [...new Set(turnos.map(t => t.pacienteId))]
    const profesionalIds = [...new Set(turnos.map(t => t.profesionalId))]

    // Obtener pacientes
    let pacientes: Array<{ id: string; nombre: string; email: string }> = []
    if (pacienteIds.length > 0) {
      const placeholders = pacienteIds.map(() => '?').join(',')
      pacientes = await prisma.$queryRawUnsafe<Array<{
        id: string
        nombre: string
        email: string
      }>>(
        `SELECT id, nombre, email FROM User WHERE id IN (${placeholders})`,
        ...pacienteIds
      )
    }

    // Obtener profesionales con usuarios
    let profesionales: Array<{ id: string; userId: string }> = []
    if (profesionalIds.length > 0) {
      const placeholders = profesionalIds.map(() => '?').join(',')
      profesionales = await prisma.$queryRawUnsafe<Array<{
        id: string
        userId: string
      }>>(
        `SELECT id, userId FROM Profesional WHERE id IN (${placeholders})`,
        ...profesionalIds
      )
    }

    const userIds = profesionales.map(p => p.userId)
    let usuarios: Array<{ id: string; nombre: string }> = []
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',')
      usuarios = await prisma.$queryRawUnsafe<Array<{
        id: string
        nombre: string
      }>>(
        `SELECT id, nombre FROM User WHERE id IN (${placeholders})`,
        ...userIds
      )
    }

    // Construir mapas para acceso rápido
    const pacientesMap = new Map(pacientes.map(p => [p.id, p]))
    const profesionalesMap = new Map(profesionales.map(p => [p.id, p]))
    const usuariosMap = new Map(usuarios.map(u => [u.id, u]))

    // Combinar datos
    return turnos.map(turno => ({
      ...turno,
      fecha: safeDate(turno.fecha) || new Date(),
      clinicId: turno.clinicId || null,
      paciente: pacientesMap.get(turno.pacienteId),
      profesional: {
        id: turno.profesionalId,
        user: profesionalesMap.get(turno.profesionalId) 
          ? usuariosMap.get(profesionalesMap.get(turno.profesionalId)!.userId)
          : undefined
      }
    })) as TurnoWithRelations[]
  } catch (error) {
    console.error("Error obteniendo turnos:", error)
    return []
  }
}

/**
 * Contar turnos con filtros
 */
export async function countTurnos(where: {
  fecha?: { gte?: Date; lt?: Date; lte?: Date }
  estado?: string | string[]
  profesionalId?: string
  pacienteId?: string
}): Promise<number> {
  try {
    let query = `SELECT COUNT(*) as count FROM Turno WHERE 1=1`
    const params: any[] = []

    if (where.fecha) {
      if (where.fecha.gte) {
        query += " AND date(fecha) >= date(?)"
        params.push(where.fecha.gte.toISOString().split('T')[0])
      }
      if (where.fecha.lt) {
        query += " AND date(fecha) < date(?)"
        params.push(where.fecha.lt.toISOString().split('T')[0])
      }
      if (where.fecha.lte) {
        query += " AND date(fecha) <= date(?)"
        params.push(where.fecha.lte.toISOString().split('T')[0])
      }
    }

    if (where.estado) {
      if (Array.isArray(where.estado)) {
        const placeholders = where.estado.map(() => "?").join(",")
        query += ` AND estado IN (${placeholders})`
        params.push(...where.estado)
      } else {
        query += " AND estado = ?"
        params.push(where.estado)
      }
    }

    if (where.profesionalId) {
      query += " AND profesionalId = ?"
      params.push(where.profesionalId)
    }

    if (where.pacienteId) {
      query += " AND pacienteId = ?"
      params.push(where.pacienteId)
    }

    const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      query,
      ...params
    )

    return Number(result[0]?.count || 0)
  } catch (error) {
    console.error("Error contando turnos:", error)
    return 0
  }
}

/**
 * Obtener turnos con filtros avanzados
 */
export async function getTurnos(where: {
  fecha?: { gte?: Date; lt?: Date; lte?: Date }
  estado?: string | string[]
  profesionalId?: string
  pacienteId?: string
  orderBy?: { fecha?: "asc" | "desc"; hora?: "asc" | "desc" }
  take?: number
}): Promise<TurnoWithRelations[]> {
  try {
    // Intentar con eliminadoPorId; si la columna no existe (DB antigua), usar consulta sin ella
    let queryConUsuario = `
      SELECT id, pacienteId, profesionalId, fecha, hora, estado, motivo, codigoTurno, clinicId,
             motivoEliminacion, eliminadoAt, eliminadoPorId
      FROM Turno
      WHERE 1=1
    `
    let querySinUsuario = `
      SELECT id, pacienteId, profesionalId, fecha, hora, estado, motivo, codigoTurno, clinicId,
             motivoEliminacion, eliminadoAt, NULL as eliminadoPorId
      FROM Turno
      WHERE 1=1
    `
    let query = queryConUsuario
    const params: any[] = []

    if (where.fecha) {
      if (where.fecha.gte) {
        query += " AND date(fecha) >= date(?)"
        params.push(where.fecha.gte.toISOString().split('T')[0])
      }
      if (where.fecha.lt) {
        query += " AND date(fecha) < date(?)"
        params.push(where.fecha.lt.toISOString().split('T')[0])
      }
      if (where.fecha.lte) {
        query += " AND date(fecha) <= date(?)"
        params.push(where.fecha.lte.toISOString().split('T')[0])
      }
    }

    if (where.estado) {
      if (Array.isArray(where.estado)) {
        const placeholders = where.estado.map(() => "?").join(",")
        query += ` AND estado IN (${placeholders})`
        params.push(...where.estado)
      } else {
        query += " AND estado = ?"
        params.push(where.estado)
      }
    }

    if (where.profesionalId) {
      query += " AND profesionalId = ?"
      params.push(where.profesionalId)
    }

    if (where.pacienteId) {
      query += " AND pacienteId = ?"
      params.push(where.pacienteId)
    }

    // Order by
    if (where.orderBy) {
      if (where.orderBy.fecha) {
        query += ` ORDER BY fecha ${where.orderBy.fecha.toUpperCase()}`
      } else if (where.orderBy.hora) {
        query += ` ORDER BY hora ${where.orderBy.hora.toUpperCase()}`
      }
    } else {
      query += " ORDER BY fecha ASC, hora ASC"
    }

    // Limit
    if (where.take) {
      query += ` LIMIT ${where.take}`
    }

    let turnos: Array<{
      id: string
      pacienteId: string
      profesionalId: string
      fecha: string | bigint | number
      hora: string
      estado: string
      motivo: string | null
      codigoTurno: string
      clinicId: string | null
      motivoEliminacion: string | null
      eliminadoAt: string | bigint | number | null
      eliminadoPorId: string | null
    }>
    try {
      turnos = await prisma.$queryRawUnsafe(query, ...params)
    } catch (err: any) {
      if (err?.message?.includes("eliminadoPorId") || err?.message?.includes("no such column")) {
        query = querySinUsuario + query.slice(queryConUsuario.length)
        turnos = await prisma.$queryRawUnsafe(query, ...params)
      } else {
        throw err
      }
    }

    if (turnos.length === 0) {
      return []
    }

    const pacienteIds = [...new Set(turnos.map(t => t.pacienteId))]
    const profesionalIds = [...new Set(turnos.map(t => t.profesionalId))]
    const eliminadoPorIds = [...new Set((turnos.map(t => t.eliminadoPorId).filter(Boolean) as string[]))]

    let eliminadoPorMap = new Map<string, { nombre: string }>()
    if (eliminadoPorIds.length > 0) {
      const ph = eliminadoPorIds.map(() => '?').join(',')
      const usuariosElim = await prisma.$queryRawUnsafe<Array<{ id: string; nombre: string }>>(
        `SELECT id, nombre FROM User WHERE id IN (${ph})`,
        ...eliminadoPorIds
      )
      eliminadoPorMap = new Map(usuariosElim.map(u => [u.id, { nombre: u.nombre }]))
    }

    let pacientes: Array<{ id: string; nombre: string; email: string }> = []
    if (pacienteIds.length > 0) {
      const placeholders = pacienteIds.map(() => '?').join(',')
      pacientes = await prisma.$queryRawUnsafe<Array<{
        id: string
        nombre: string
        email: string
      }>>(
        `SELECT id, nombre, email FROM User WHERE id IN (${placeholders})`,
        ...pacienteIds
      )
    }

    let profesionales: Array<{ id: string; userId: string; especialidad: string }> = []
    if (profesionalIds.length > 0) {
      const placeholders = profesionalIds.map(() => '?').join(',')
      profesionales = await prisma.$queryRawUnsafe<Array<{
        id: string
        userId: string
        especialidad: string
      }>>(
        `SELECT id, userId, especialidad FROM Profesional WHERE id IN (${placeholders})`,
        ...profesionalIds
      )
    }

    const userIds = profesionales.map(p => p.userId)
    let usuarios: Array<{ id: string; nombre: string }> = []
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',')
      usuarios = await prisma.$queryRawUnsafe<Array<{
        id: string
        nombre: string
      }>>(
        `SELECT id, nombre FROM User WHERE id IN (${placeholders})`,
        ...userIds
      )
    }

    const pacientesMap = new Map(pacientes.map(p => [p.id, p]))
    const profesionalesMap = new Map(profesionales.map(p => [p.id, p]))
    const usuariosMap = new Map(usuarios.map(u => [u.id, u]))

    return turnos.map(turno => ({
      ...turno,
      fecha: safeDate(turno.fecha) || new Date(),
      clinicId: turno.clinicId || null,
      motivoEliminacion: turno.motivoEliminacion || null,
      eliminadoAt: turno.eliminadoAt ? safeDate(turno.eliminadoAt) : null,
      eliminadoPor: turno.eliminadoPorId ? eliminadoPorMap.get(turno.eliminadoPorId) : undefined,
      paciente: pacientesMap.get(turno.pacienteId),
      profesional: {
        id: turno.profesionalId,
        especialidad: profesionalesMap.get(turno.profesionalId)?.especialidad,
        user: profesionalesMap.get(turno.profesionalId) 
          ? usuariosMap.get(profesionalesMap.get(turno.profesionalId)!.userId)
          : undefined
      }
    })) as TurnoWithRelations[]
  } catch (error) {
    console.error("Error obteniendo turnos:", error)
    return []
  }
}

/**
 * Obtener un turno por ID con relaciones usando SQL raw
 */
export async function getTurnoById(id: string): Promise<(TurnoWithRelations & {
  obraSocial?: string | null
  arancel?: number | null
  motivoCancelacion?: string | null
  canceladoAt?: Date | null
  motivoEliminacion?: string | null
  eliminadoAt?: Date | null
  eliminadoPor?: { nombre: string }
}) | null> {
  try {
    type TurnoRow = {
      id: string
      pacienteId: string
      profesionalId: string
      consultorioProfesionalId: string | null
      fecha: string | bigint | number
      hora: string
      estado: string
      motivo: string | null
      codigoTurno: string
      clinicId: string | null
      obraSocial: string | null
      arancel: number | null
      motivoCancelacion: string | null
      canceladoAt: string | bigint | number | null
      motivoEliminacion: string | null
      eliminadoAt: string | bigint | number | null
      eliminadoPorId: string | null
    }
    let turnos: TurnoRow[]
    try {
      turnos = await prisma.$queryRawUnsafe<TurnoRow[]>(
        `SELECT id, pacienteId, profesionalId, consultorioProfesionalId, fecha, hora, estado, motivo, codigoTurno, clinicId,
         obraSocial, arancel, motivoCancelacion, canceladoAt, motivoEliminacion, eliminadoAt, eliminadoPorId
         FROM Turno WHERE id = ? LIMIT 1`,
        id
      )
    } catch (err: any) {
      if (err?.message?.includes("eliminadoPorId") || err?.message?.includes("no such column")) {
        turnos = await prisma.$queryRawUnsafe<TurnoRow[]>(
          `SELECT id, pacienteId, profesionalId, consultorioProfesionalId, fecha, hora, estado, motivo, codigoTurno, clinicId,
           obraSocial, arancel, motivoCancelacion, canceladoAt, motivoEliminacion, eliminadoAt, NULL as eliminadoPorId
           FROM Turno WHERE id = ? LIMIT 1`,
          id
        )
      } else {
        throw err
      }
    }

    if (turnos.length === 0) {
      return null
    }

    const turno = turnos[0]

    const [pacientes, profesionalesRaw, eliminadoPorUser] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ id: string; nombre: string; email: string }>>(
        `SELECT id, nombre, email FROM User WHERE id = ? LIMIT 1`,
        turno.pacienteId
      ),
      prisma.$queryRawUnsafe<Array<{ id: string; userId: string; especialidad: string }>>(
        `SELECT id, userId, especialidad FROM Profesional WHERE id = ? LIMIT 1`,
        turno.profesionalId
      ),
      turno.eliminadoPorId
        ? prisma.$queryRawUnsafe<Array<{ id: string; nombre: string }>>(
            `SELECT id, nombre FROM User WHERE id = ? LIMIT 1`,
            turno.eliminadoPorId
          )
        : Promise.resolve([]),
    ])

    let profesional: TurnoWithRelations["profesional"] = undefined
    if (profesionalesRaw.length > 0) {
      const us = await prisma.$queryRawUnsafe<Array<{ id: string; nombre: string }>>(
        `SELECT id, nombre FROM User WHERE id = ? LIMIT 1`,
        profesionalesRaw[0].userId
      )
      profesional = {
        id: profesionalesRaw[0].id,
        especialidad: profesionalesRaw[0].especialidad,
        user: us.length > 0 ? us[0] : undefined,
      }
    }

    return {
      id: turno.id,
      pacienteId: turno.pacienteId,
      profesionalId: turno.profesionalId,
      consultorioProfesionalId: turno.consultorioProfesionalId || null,
      fecha: safeDate(turno.fecha) || new Date(),
      hora: turno.hora,
      estado: turno.estado,
      motivo: turno.motivo,
      codigoTurno: turno.codigoTurno,
      clinicId: turno.clinicId || null,
      paciente: pacientes.length > 0 ? pacientes[0] : undefined,
      profesional,
      obraSocial: turno.obraSocial,
      arancel: turno.arancel,
      motivoCancelacion: turno.motivoCancelacion,
      canceladoAt: safeDate(turno.canceladoAt),
      motivoEliminacion: turno.motivoEliminacion,
      eliminadoAt: safeDate(turno.eliminadoAt),
      eliminadoPor: eliminadoPorUser.length > 0 ? { nombre: eliminadoPorUser[0].nombre } : undefined,
    }
  } catch (error) {
    console.error("Error obteniendo turno por ID:", error)
    return null
  }
}

/**
 * Verificar si existe un turno en un horario específico usando SQL raw
 */
export async function existeTurnoEnHorario(
  profesionalId: string,
  fecha: Date,
  hora: string,
  estado: string[] = ["PENDIENTE", "CONFIRMADO"],
  excluirTurnoId?: string
): Promise<boolean> {
  try {
    const fechaStr = fecha.toISOString().split('T')[0]
    let query = `
      SELECT COUNT(*) as count 
      FROM Turno 
      WHERE profesionalId = ? 
        AND date(fecha) = date(?)
        AND hora = ?
        AND estado IN (${estado.map(() => "?").join(",")})
    `
    const params: any[] = [profesionalId, fechaStr, hora, ...estado]

    if (excluirTurnoId) {
      query += " AND id != ?"
      params.push(excluirTurnoId)
    }

    const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      query,
      ...params
    )

    return Number(result[0]?.count || 0) > 0
  } catch (error) {
    console.error("Error verificando turno existente:", error)
    return false
  }
}
