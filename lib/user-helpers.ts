/**
 * User Helpers
 * Funciones helper para consultas de User usando SQL raw
 * para evitar problemas con la columna clinicId que no existe en SQLite
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

export interface UserWithRelations {
  id: string
  nombre: string
  dni: string | null
  email: string
  telefono: string | null
  fechaNacimiento: Date | null
  direccion: string | null
  fotoPerfil: string | null
  obraSocial: string | null
  obraSocialId: string | null
  role: string
  createdAt: Date
  updatedAt: Date
  obraSocialRel?: {
    nombre: string
  } | null
  pacienteTurnos?: Array<{
    fecha: Date
  }>
}

/**
 * Obtener usuarios con filtros usando SQL raw
 */
export async function getUsers(where: {
  role?: string
  search?: string
  obraSocialId?: string
  profesionalId?: string
  includeObraSocial?: boolean
  includeUltimaVisita?: boolean
  orderBy?: { nombre?: "asc" | "desc"; createdAt?: "asc" | "desc" }
  take?: number
  skip?: number
}): Promise<UserWithRelations[]> {
  try {
    // Construir WHERE clause
    const conditions: string[] = []
    const params: any[] = []

    if (where.role) {
      conditions.push("role = ?")
      params.push(where.role)
    }

    if (where.search) {
      conditions.push(
        "(nombre LIKE ? OR dni LIKE ? OR email LIKE ?)"
      )
      const searchPattern = `%${where.search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    if (where.obraSocialId) {
      conditions.push("obraSocialId = ?")
      params.push(where.obraSocialId)
    }

    // Si se requiere filtrar por profesional, necesitamos hacer JOIN con Turno
    // Por ahora, lo omitimos si no es necesario

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // Construir ORDER BY
    let orderByClause = "ORDER BY nombre ASC"
    if (where.orderBy) {
      if (where.orderBy.nombre) {
        orderByClause = `ORDER BY nombre ${where.orderBy.nombre.toUpperCase()}`
      } else if (where.orderBy.createdAt) {
        orderByClause = `ORDER BY createdAt ${where.orderBy.createdAt.toUpperCase()}`
      }
    }

    // Construir LIMIT y OFFSET
    let limitClause = ""
    if (where.take) {
      limitClause = `LIMIT ${where.take}`
      if (where.skip) {
        limitClause += ` OFFSET ${where.skip}`
      }
    }

    // Query principal
    const query = `
      SELECT 
        id, nombre, dni, email, telefono, fechaNacimiento, direccion, 
        fotoPerfil, obraSocial, obraSocialId, role, createdAt, updatedAt
      FROM User
      ${whereClause}
      ${orderByClause}
      ${limitClause}
    `

    const users = await prisma.$queryRawUnsafe<Array<{
      id: string
      nombre: string
      dni: string | null
      email: string
      telefono: string | null
      fechaNacimiento: string | bigint | number | null
      direccion: string | null
      fotoPerfil: string | null
      obraSocial: string | null
      obraSocialId: string | null
      role: string
      createdAt: string | bigint | number
      updatedAt: string | bigint | number
    }>>(query, ...params)

    if (users.length === 0) {
      return []
    }

    // Obtener obraSocial si se requiere
    let obraSocialMap = new Map<string, { nombre: string }>()
    if (where.includeObraSocial) {
      const obraSocialIds = users
        .map((u) => u.obraSocialId)
        .filter((id): id is string => id !== null)
      if (obraSocialIds.length > 0) {
        const placeholders = obraSocialIds.map(() => "?").join(",")
        const obrasSociales = await prisma.$queryRawUnsafe<Array<{
          id: string
          nombre: string
        }>>(
          `SELECT id, nombre FROM ObraSocial WHERE id IN (${placeholders})`,
          ...obraSocialIds
        )
        obrasSociales.forEach((os) => {
          obraSocialMap.set(os.id, { nombre: os.nombre })
        })
      }
    }

    // Obtener última visita si se requiere
    let ultimaVisitaMap = new Map<string, Date>()
    if (where.includeUltimaVisita) {
      const userIds = users.map((u) => u.id)
      if (userIds.length > 0) {
        const placeholders = userIds.map(() => "?").join(",")
        const turnos = await prisma.$queryRawUnsafe<Array<{
          pacienteId: string
          fecha: string | bigint | number
        }>>(
          `SELECT pacienteId, MAX(fecha) as fecha 
           FROM Turno 
           WHERE pacienteId IN (${placeholders}) 
             AND estado IN ('COMPLETADO', 'CONFIRMADO')
           GROUP BY pacienteId`,
          ...userIds
        )
        turnos.forEach((t) => {
          const fecha = safeDate(t.fecha)
          if (fecha) {
            ultimaVisitaMap.set(t.pacienteId, fecha)
          }
        })
      }
    }

    // Formatear resultados
    return users.map((user) => ({
      id: user.id,
      nombre: user.nombre,
      dni: user.dni,
      email: user.email,
      telefono: user.telefono,
      fechaNacimiento: user.fechaNacimiento
        ? new Date(user.fechaNacimiento)
        : null,
      direccion: user.direccion,
      fotoPerfil: user.fotoPerfil,
      obraSocial: user.obraSocial,
      obraSocialId: user.obraSocialId,
      role: user.role,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
      obraSocialRel: user.obraSocialId
        ? obraSocialMap.get(user.obraSocialId) || null
        : null,
      pacienteTurnos:
        where.includeUltimaVisita && ultimaVisitaMap.has(user.id)
          ? [{ fecha: ultimaVisitaMap.get(user.id)! }]
          : [],
    }))
  } catch (error) {
    console.error("Error en getUsers:", error)
    throw error
  }
}

/**
 * Contar usuarios con filtros usando SQL raw
 */
export async function countUsers(where: {
  role?: string
  search?: string
  obraSocialId?: string
  createdAt?: { gte?: Date }
}): Promise<number> {
  try {
    const conditions: string[] = []
    const params: any[] = []

    if (where.role) {
      conditions.push("role = ?")
      params.push(where.role)
    }

    if (where.search) {
      conditions.push(
        "(nombre LIKE ? OR dni LIKE ? OR email LIKE ?)"
      )
      const searchPattern = `%${where.search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    if (where.obraSocialId) {
      conditions.push("obraSocialId = ?")
      params.push(where.obraSocialId)
    }

    if (where.createdAt?.gte) {
      conditions.push("createdAt >= ?")
      params.push(where.createdAt.gte.toISOString())
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    const query = `SELECT COUNT(*) as count FROM User ${whereClause}`

    const result = await prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
      query,
      ...params
    )

    const count = result[0]?.count
    return typeof count === 'bigint' ? Number(count) : (count || 0)
  } catch (error) {
    console.error("Error en countUsers:", error)
    throw error
  }
}

/**
 * Obtener un usuario por ID usando SQL raw
 */
export async function getUserById(
  id: string,
  options?: {
    includeObraSocial?: boolean
  }
): Promise<UserWithRelations | null> {
  try {
    const query = `
      SELECT 
        id, nombre, dni, email, telefono, fechaNacimiento, direccion, 
        fotoPerfil, obraSocial, obraSocialId, role, createdAt, updatedAt
      FROM User
      WHERE id = ?
      LIMIT 1
    `

    const result = await prisma.$queryRawUnsafe<Array<{
      id: string
      nombre: string
      dni: string | null
      email: string
      telefono: string | null
      fechaNacimiento: string | bigint | number | null
      direccion: string | null
      fotoPerfil: string | null
      obraSocial: string | null
      obraSocialId: string | null
      role: string
      createdAt: string | bigint | number
      updatedAt: string | bigint | number
    }>>(query, id)

    if (result.length === 0) {
      return null
    }

    const user = result[0]

    // Obtener obraSocial si se requiere
    let obraSocialRel = null
    if (options?.includeObraSocial && user.obraSocialId) {
      const obraSocial = await prisma.$queryRawUnsafe<Array<{
        id: string
        nombre: string
      }>>(
        `SELECT id, nombre FROM ObraSocial WHERE id = ? LIMIT 1`,
        user.obraSocialId
      )
      if (obraSocial.length > 0) {
        obraSocialRel = { nombre: obraSocial[0].nombre }
      }
    }

    return {
      id: user.id,
      nombre: user.nombre,
      dni: user.dni,
      email: user.email,
      telefono: user.telefono,
      fechaNacimiento: safeDate(user.fechaNacimiento),
      direccion: user.direccion,
      fotoPerfil: user.fotoPerfil,
      obraSocial: user.obraSocial,
      obraSocialId: user.obraSocialId,
      role: user.role,
      createdAt: safeDate(user.createdAt) || new Date(),
      updatedAt: safeDate(user.updatedAt) || new Date(),
      obraSocialRel: obraSocialRel,
      pacienteTurnos: [],
    }
  } catch (error) {
    console.error("Error en getUserById:", error)
    throw error
  }
}

/**
 * Obtener un usuario por email usando SQL raw
 */
export async function getUserByEmail(email: string): Promise<UserWithRelations | null> {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{
      id: string
      nombre: string
      dni: string | null
      email: string
      telefono: string | null
      fechaNacimiento: string | bigint | number | null
      direccion: string | null
      fotoPerfil: string | null
      obraSocial: string | null
      obraSocialId: string | null
      role: string
      createdAt: string | bigint | number
      updatedAt: string | bigint | number
    }>>(
      `SELECT id, nombre, dni, email, telefono, fechaNacimiento, direccion, 
       fotoPerfil, obraSocial, obraSocialId, role, createdAt, updatedAt
       FROM User WHERE email = ? LIMIT 1`,
      email
    )

    if (result.length === 0) {
      return null
    }

    const user = result[0]
    return {
      id: user.id,
      nombre: user.nombre,
      dni: user.dni,
      email: user.email,
      telefono: user.telefono,
      fechaNacimiento: safeDate(user.fechaNacimiento),
      direccion: user.direccion,
      fotoPerfil: user.fotoPerfil,
      obraSocial: user.obraSocial,
      obraSocialId: user.obraSocialId,
      role: user.role,
      createdAt: safeDate(user.createdAt) || new Date(),
      updatedAt: safeDate(user.updatedAt) || new Date(),
      obraSocialRel: null,
      pacienteTurnos: [],
    }
  } catch (error) {
    console.error("Error en getUserByEmail:", error)
    throw error
  }
}

/**
 * Obtener un usuario por DNI usando SQL raw
 */
export async function getUserByDni(dni: string): Promise<UserWithRelations | null> {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{
      id: string
      nombre: string
      dni: string | null
      email: string
      telefono: string | null
      fechaNacimiento: string | bigint | number | null
      direccion: string | null
      fotoPerfil: string | null
      obraSocial: string | null
      obraSocialId: string | null
      role: string
      createdAt: string | bigint | number
      updatedAt: string | bigint | number
    }>>(
      `SELECT id, nombre, dni, email, telefono, fechaNacimiento, direccion, 
       fotoPerfil, obraSocial, obraSocialId, role, createdAt, updatedAt
       FROM User WHERE dni = ? LIMIT 1`,
      dni
    )

    if (result.length === 0) {
      return null
    }

    const user = result[0]
    return {
      id: user.id,
      nombre: user.nombre,
      dni: user.dni,
      email: user.email,
      telefono: user.telefono,
      fechaNacimiento: safeDate(user.fechaNacimiento),
      direccion: user.direccion,
      fotoPerfil: user.fotoPerfil,
      obraSocial: user.obraSocial,
      obraSocialId: user.obraSocialId,
      role: user.role,
      createdAt: safeDate(user.createdAt) || new Date(),
      updatedAt: safeDate(user.updatedAt) || new Date(),
      obraSocialRel: null,
      pacienteTurnos: [],
    }
  } catch (error) {
    console.error("Error en getUserByDni:", error)
    throw error
  }
}
