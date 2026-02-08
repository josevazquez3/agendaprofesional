/**
 * Profesional Helpers
 * Funciones helper para consultas de Profesional usando SQL raw
 * para evitar problemas con la columna clinicId que no existe en SQLite
 */

import { prisma } from "./prisma"

export interface ProfesionalWithRelations {
  id: string
  userId: string
  especialidad: string
  matricula: string | null
  atiendeObraSocial: boolean
  createdAt: Date
  updatedAt: Date
  user?: {
    id?: string
    nombre: string
    email?: string
    telefono?: string
    dni?: string
    fotoPerfil?: string
    obraSocial?: string
  }
}

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

/**
 * Obtener profesionales usando SQL raw
 */
export async function getProfesionales(options?: {
  includeUser?: boolean
  includeUserFields?: string[]
}): Promise<ProfesionalWithRelations[]> {
  try {
    // Query principal sin clinicId
    const query = `
      SELECT 
        id, userId, especialidad, matricula, atiendeObraSocial, createdAt, updatedAt
      FROM Profesional
      ORDER BY createdAt DESC
    `

    const profesionales = await prisma.$queryRawUnsafe<Array<{
      id: string
      userId: string
      especialidad: string
      matricula: string | null
      atiendeObraSocial: number | boolean
      createdAt: string | bigint | number
      updatedAt: string | bigint | number
    }>>(query)

    if (profesionales.length === 0) {
      return []
    }

    // Obtener datos de usuarios si se requiere
    let usuariosMap = new Map<string, any>()
    if (options?.includeUser) {
      const userIds = profesionales.map((p) => p.userId)
      if (userIds.length > 0) {
        const placeholders = userIds.map(() => "?").join(",")
        const userFields = options.includeUserFields || ["nombre"]
        const fields = userFields.join(", ")
        
        const usuarios = await prisma.$queryRawUnsafe<Array<{
          id: string
          nombre: string
          email?: string
          telefono?: string
          dni?: string
          fotoPerfil?: string
          obraSocial?: string
        }>>(
          `SELECT id, ${fields} FROM User WHERE id IN (${placeholders})`,
          ...userIds
        )
        
        usuarios.forEach((u) => {
          usuariosMap.set(u.id, u)
        })
      }
    }

    // Formatear resultados
    return profesionales.map((prof) => ({
      id: prof.id,
      userId: prof.userId,
      especialidad: prof.especialidad,
      matricula: prof.matricula,
      atiendeObraSocial: typeof prof.atiendeObraSocial === 'number' 
        ? prof.atiendeObraSocial === 1 
        : prof.atiendeObraSocial,
      createdAt: safeDate(prof.createdAt) || new Date(),
      updatedAt: safeDate(prof.updatedAt) || new Date(),
      user: options?.includeUser && usuariosMap.has(prof.userId)
        ? usuariosMap.get(prof.userId)
        : undefined,
    }))
  } catch (error) {
    console.error("Error en getProfesionales:", error)
    throw error
  }
}

/**
 * Obtener un profesional por ID usando SQL raw
 */
export async function getProfesionalById(
  id: string,
  options?: {
    includeUser?: boolean
    includeUserFields?: string[]
  }
): Promise<ProfesionalWithRelations | null> {
  try {
    const query = `
      SELECT 
        id, userId, especialidad, matricula, atiendeObraSocial, createdAt, updatedAt
      FROM Profesional
      WHERE id = ?
      LIMIT 1
    `

    const result = await prisma.$queryRawUnsafe<Array<{
      id: string
      userId: string
      especialidad: string
      matricula: string | null
      atiendeObraSocial: number | boolean
      createdAt: string | bigint | number
      updatedAt: string | bigint | number
    }>>(query, id)

    if (result.length === 0) {
      return null
    }

    const prof = result[0]

    // Obtener datos de usuario si se requiere
    let user = undefined
    if (options?.includeUser) {
      const userFields = options.includeUserFields || ["nombre"]
      const fields = userFields.join(", ")
      
      const usuarios = await prisma.$queryRawUnsafe<Array<{
        id: string
        nombre: string
        email?: string
        telefono?: string
        dni?: string
        fotoPerfil?: string
        obraSocial?: string
      }>>(
        `SELECT id, ${fields} FROM User WHERE id = ? LIMIT 1`,
        prof.userId
      )
      
      if (usuarios.length > 0) {
        user = usuarios[0]
      }
    }

    return {
      id: prof.id,
      userId: prof.userId,
      especialidad: prof.especialidad,
      matricula: prof.matricula,
      atiendeObraSocial: typeof prof.atiendeObraSocial === 'number' 
        ? prof.atiendeObraSocial === 1 
        : prof.atiendeObraSocial,
      createdAt: safeDate(prof.createdAt) || new Date(),
      updatedAt: safeDate(prof.updatedAt) || new Date(),
      user,
    }
  } catch (error) {
    console.error("Error en getProfesionalById:", error)
    throw error
  }
}

/**
 * Obtener un profesional por userId usando SQL raw
 */
export async function getProfesionalByUserId(
  userId: string,
  options?: {
    includeUser?: boolean
    includeUserFields?: string[]
  }
): Promise<ProfesionalWithRelations | null> {
  try {
    const query = `
      SELECT 
        id, userId, especialidad, matricula, atiendeObraSocial, createdAt, updatedAt
      FROM Profesional
      WHERE userId = ?
      LIMIT 1
    `

    const result = await prisma.$queryRawUnsafe<Array<{
      id: string
      userId: string
      especialidad: string
      matricula: string | null
      atiendeObraSocial: number | boolean
      createdAt: string | bigint | number
      updatedAt: string | bigint | number
    }>>(query, userId)

    if (result.length === 0) {
      return null
    }

    const prof = result[0]

    // Obtener datos de usuario si se requiere
    let user = undefined
    if (options?.includeUser) {
      const userFields = options.includeUserFields || ["nombre"]
      const fields = userFields.join(", ")
      
      const usuarios = await prisma.$queryRawUnsafe<Array<{
        id: string
        nombre: string
        email?: string
        telefono?: string
        dni?: string
        fotoPerfil?: string
        obraSocial?: string
      }>>(
        `SELECT id, ${fields} FROM User WHERE id = ? LIMIT 1`,
        prof.userId
      )
      
      if (usuarios.length > 0) {
        user = usuarios[0]
      }
    }

    return {
      id: prof.id,
      userId: prof.userId,
      especialidad: prof.especialidad,
      matricula: prof.matricula,
      atiendeObraSocial: typeof prof.atiendeObraSocial === 'number' 
        ? prof.atiendeObraSocial === 1 
        : prof.atiendeObraSocial,
      createdAt: safeDate(prof.createdAt) || new Date(),
      updatedAt: safeDate(prof.updatedAt) || new Date(),
      user,
    }
  } catch (error) {
    console.error("Error en getProfesionalByUserId:", error)
    throw error
  }
}

/**
 * Contar profesionales usando SQL raw
 */
export async function countProfesionales(): Promise<number> {
  try {
    const query = `SELECT COUNT(*) as count FROM Profesional`
    const result = await prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(query)
    const count = result[0]?.count
    return typeof count === 'bigint' ? Number(count) : (count || 0)
  } catch (error) {
    console.error("Error en countProfesionales:", error)
    throw error
  }
}
