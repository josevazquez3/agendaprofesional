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
 * Obtener profesionales (Prisma, compatible con PostgreSQL)
 */
export async function getProfesionales(options?: {
  includeUser?: boolean
  includeUserFields?: string[]
}): Promise<ProfesionalWithRelations[]> {
  try {
    const list = await prisma.profesional.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: options?.includeUser
          ? {
              select: {
                id: true,
                nombre: true,
                email: true,
                telefono: true,
                dni: true,
                fotoPerfil: true,
                obraSocial: true,
              },
            }
          : false,
      },
    })
    return list.map((prof) => ({
      id: prof.id,
      userId: prof.userId,
      especialidad: prof.especialidad,
      matricula: prof.matricula,
      atiendeObraSocial: prof.atiendeObraSocial,
      createdAt: prof.createdAt,
      updatedAt: prof.updatedAt,
      user: prof.user ?? undefined,
    }))
  } catch (error) {
    console.error("Error en getProfesionales:", error)
    throw error
  }
}

/**
 * Obtener un profesional por ID (Prisma, compatible con PostgreSQL)
 */
export async function getProfesionalById(
  id: string,
  options?: {
    includeUser?: boolean
    includeUserFields?: string[]
  }
): Promise<ProfesionalWithRelations | null> {
  try {
    const prof = await prisma.profesional.findUnique({
      where: { id },
      include: {
        user: options?.includeUser
          ? {
              select: {
                id: true,
                nombre: true,
                email: true,
                telefono: true,
                dni: true,
                fotoPerfil: true,
                obraSocial: true,
              },
            }
          : false,
      },
    })
    if (!prof) return null
    return {
      id: prof.id,
      userId: prof.userId,
      especialidad: prof.especialidad,
      matricula: prof.matricula,
      atiendeObraSocial: prof.atiendeObraSocial,
      createdAt: prof.createdAt,
      updatedAt: prof.updatedAt,
      user: prof.user ?? undefined,
    }
  } catch (error) {
    console.error("Error en getProfesionalById:", error)
    throw error
  }
}

/**
 * Obtener un profesional por userId (Prisma, compatible con PostgreSQL)
 */
export async function getProfesionalByUserId(
  userId: string,
  options?: {
    includeUser?: boolean
    includeUserFields?: string[]
  }
): Promise<ProfesionalWithRelations | null> {
  try {
    const prof = await prisma.profesional.findUnique({
      where: { userId },
      include: {
        user: options?.includeUser
          ? {
              select: {
                id: true,
                nombre: true,
                email: true,
                telefono: true,
                dni: true,
                fotoPerfil: true,
                obraSocial: true,
              },
            }
          : false,
      },
    })
    if (!prof) return null
    return {
      id: prof.id,
      userId: prof.userId,
      especialidad: prof.especialidad,
      matricula: prof.matricula,
      atiendeObraSocial: prof.atiendeObraSocial,
      createdAt: prof.createdAt,
      updatedAt: prof.updatedAt,
      user: prof.user ?? undefined,
    }
  } catch (error) {
    console.error("Error en getProfesionalByUserId:", error)
    throw error
  }
}

/**
 * Contar profesionales (Prisma, compatible con PostgreSQL)
 */
export async function countProfesionales(): Promise<number> {
  try {
    return prisma.profesional.count()
  } catch (error) {
    console.error("Error en countProfesionales:", error)
    throw error
  }
}
