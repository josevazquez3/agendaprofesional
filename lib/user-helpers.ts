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
  bloqueado?: boolean
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
 * Obtener usuarios con filtros (Prisma, compatible con PostgreSQL)
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
    const andConditions: Record<string, unknown>[] = []
    if (where.role) andConditions.push({ role: where.role })
    if (where.obraSocialId) andConditions.push({ obraSocialId: where.obraSocialId })
    if (where.search) {
      const searchTerms = where.search.trim().split(/\s+/).filter((t) => t.length > 0)
      const searchPattern = where.search.trim()
      if (searchTerms.length > 0) {
        andConditions.push({
          OR: [
            { AND: searchTerms.map((term) => ({ nombre: { contains: term, mode: "insensitive" as const } })) },
            { dni: { contains: searchPattern, mode: "insensitive" as const } },
            { email: { contains: searchPattern, mode: "insensitive" as const } },
          ],
        })
      } else {
        andConditions.push({
          OR: [
            { nombre: { contains: searchPattern, mode: "insensitive" as const } },
            { dni: { contains: searchPattern, mode: "insensitive" as const } },
            { email: { contains: searchPattern, mode: "insensitive" as const } },
          ],
        })
      }
    }
    const whereClause = andConditions.length > 0 ? { AND: andConditions } : {}
    const orderBy = where.orderBy?.nombre
      ? { nombre: where.orderBy.nombre }
      : where.orderBy?.createdAt
        ? { createdAt: where.orderBy.createdAt }
        : { nombre: "asc" as const }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy,
      take: where.take ?? undefined,
      skip: where.skip ?? undefined,
      select: {
        id: true,
        nombre: true,
        dni: true,
        email: true,
        telefono: true,
        fechaNacimiento: true,
        direccion: true,
        fotoPerfil: true,
        obraSocial: true,
        obraSocialId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        ...(where.includeObraSocial && { obraSocialRel: { select: { nombre: true } } }),
      },
    })

    let ultimaVisitaMap = new Map<string, Date>()
    if (where.includeUltimaVisita && users.length > 0) {
      const userIds = users.map((u) => u.id)
      const turnos = await prisma.turno.groupBy({
        by: ["pacienteId"],
        where: {
          pacienteId: { in: userIds },
          estado: { in: ["COMPLETADO", "CONFIRMADO"] },
        },
        _max: { fecha: true },
      })
      turnos.forEach((t) => {
        if (t._max.fecha) ultimaVisitaMap.set(t.pacienteId, t._max.fecha)
      })
    }

    return users.map((user) => ({
      id: user.id,
      nombre: user.nombre,
      dni: user.dni,
      email: user.email,
      telefono: user.telefono,
      fechaNacimiento: user.fechaNacimiento,
      direccion: user.direccion,
      fotoPerfil: user.fotoPerfil,
      obraSocial: user.obraSocial,
      obraSocialId: user.obraSocialId,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      obraSocialRel: "obraSocialRel" in user && user.obraSocialRel ? { nombre: (user.obraSocialRel as { nombre: string }).nombre } : null,
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
 * Contar usuarios con filtros (Prisma, compatible con PostgreSQL)
 */
export async function countUsers(where: {
  role?: string
  search?: string
  obraSocialId?: string
  createdAt?: { gte?: Date }
}): Promise<number> {
  try {
    const andConditions: Record<string, unknown>[] = []
    if (where.role) andConditions.push({ role: where.role })
    if (where.obraSocialId) andConditions.push({ obraSocialId: where.obraSocialId })
    if (where.createdAt?.gte) andConditions.push({ createdAt: { gte: where.createdAt.gte } })
    if (where.search) {
      const searchPattern = where.search.trim()
      andConditions.push({
        OR: [
          { nombre: { contains: searchPattern, mode: "insensitive" as const } },
          { dni: { contains: searchPattern, mode: "insensitive" as const } },
          { email: { contains: searchPattern, mode: "insensitive" as const } },
        ],
      })
    }
    const whereClause = andConditions.length > 0 ? { AND: andConditions } : {}
    return prisma.user.count({ where: whereClause })
  } catch (error) {
    console.error("Error en countUsers:", error)
    throw error
  }
}

/**
 * Obtener un usuario por ID (Prisma, compatible con PostgreSQL)
 */
export async function getUserById(
  id: string,
  options?: {
    includeObraSocial?: boolean
  }
): Promise<UserWithRelations | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        dni: true,
        email: true,
        telefono: true,
        fechaNacimiento: true,
        direccion: true,
        fotoPerfil: true,
        obraSocial: true,
        obraSocialId: true,
        role: true,
        bloqueado: true,
        createdAt: true,
        updatedAt: true,
        ...(options?.includeObraSocial && { obraSocialRel: { select: { nombre: true } } }),
      },
    })
    if (!user) return null
    return {
      id: user.id,
      nombre: user.nombre,
      dni: user.dni,
      email: user.email,
      telefono: user.telefono,
      fechaNacimiento: user.fechaNacimiento,
      direccion: user.direccion,
      fotoPerfil: user.fotoPerfil,
      obraSocial: user.obraSocial,
      obraSocialId: user.obraSocialId,
      role: user.role,
      bloqueado: "bloqueado" in user ? user.bloqueado : false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      obraSocialRel: "obraSocialRel" in user && user.obraSocialRel ? { nombre: (user.obraSocialRel as { nombre: string }).nombre } : null,
      pacienteTurnos: [],
    }
  } catch (error) {
    console.error("Error en getUserById:", error)
    throw error
  }
}

/**
 * Obtener un usuario por email (Prisma, compatible con PostgreSQL)
 */
export async function getUserByEmail(email: string): Promise<UserWithRelations | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        nombre: true,
        dni: true,
        email: true,
        telefono: true,
        fechaNacimiento: true,
        direccion: true,
        fotoPerfil: true,
        obraSocial: true,
        obraSocialId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        obraSocialRel: { select: { nombre: true } },
      },
    })
    if (!user) return null
    return {
      id: user.id,
      nombre: user.nombre,
      dni: user.dni,
      email: user.email,
      telefono: user.telefono,
      fechaNacimiento: user.fechaNacimiento,
      direccion: user.direccion,
      fotoPerfil: user.fotoPerfil,
      obraSocial: user.obraSocial,
      obraSocialId: user.obraSocialId,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      obraSocialRel: user.obraSocialRel ?? null,
      pacienteTurnos: [],
    }
  } catch (error) {
    console.error("Error en getUserByEmail:", error)
    throw error
  }
}

/**
 * Obtener un usuario por DNI (Prisma, compatible con PostgreSQL)
 */
export async function getUserByDni(dni: string): Promise<UserWithRelations | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { dni },
      select: {
        id: true,
        nombre: true,
        dni: true,
        email: true,
        telefono: true,
        fechaNacimiento: true,
        direccion: true,
        fotoPerfil: true,
        obraSocial: true,
        obraSocialId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        obraSocialRel: { select: { nombre: true } },
      },
    })
    if (!user) return null
    return {
      id: user.id,
      nombre: user.nombre,
      dni: user.dni,
      email: user.email,
      telefono: user.telefono,
      fechaNacimiento: user.fechaNacimiento,
      direccion: user.direccion,
      fotoPerfil: user.fotoPerfil,
      obraSocial: user.obraSocial,
      obraSocialId: user.obraSocialId,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      obraSocialRel: user.obraSocialRel ?? null,
      pacienteTurnos: [],
    }
  } catch (error) {
    console.error("Error en getUserByDni:", error)
    throw error
  }
}
