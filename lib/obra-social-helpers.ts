/**
 * ObraSocial Helpers
 * Funciones helper para consultas de ObraSocial usando SQL raw
 * para evitar problemas con la columna clinicId que no existe en SQLite
 */

import { prisma } from "./prisma"

export interface ObraSocialWithRelations {
  id: string
  nombre: string
  codigo: string | null
  descripcion: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  activa: boolean
  createdAt: Date
  updatedAt: Date
  _count?: {
    pacientes: number
    turnos: number
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
 * Obtener obras sociales (Prisma, compatible con PostgreSQL)
 */
export async function getObrasSociales(options?: {
  activa?: boolean
  includeCounts?: boolean
  orderBy?: { nombre?: "asc" | "desc" }
}): Promise<ObraSocialWithRelations[]> {
  try {
    const obrasSociales = await prisma.obraSocial.findMany({
      where: options?.activa !== undefined ? { activa: options.activa } : undefined,
      orderBy: { nombre: options?.orderBy?.nombre ?? "asc" },
      include: options?.includeCounts
        ? {
            _count: {
              select: {
                pacientes: true,
                turnos: true,
              },
            },
          }
        : undefined,
    })
    return obrasSociales.map((os) => {
      const count =
        options?.includeCounts && "_count" in os && os._count
          ? (os._count as { pacientes: number; turnos: number })
          : undefined
      return {
        id: os.id,
        nombre: os.nombre,
        codigo: os.codigo,
        descripcion: os.descripcion,
        telefono: os.telefono,
        email: os.email,
        direccion: os.direccion,
        activa: os.activa,
        createdAt: os.createdAt,
        updatedAt: os.updatedAt,
        _count: count ? { pacientes: count.pacientes, turnos: count.turnos } : undefined,
      }
    })
  } catch (error) {
    console.error("Error en getObrasSociales:", error)
    throw error
  }
}

/**
 * Obtener una obra social por ID (Prisma, compatible con PostgreSQL)
 */
export async function getObraSocialById(
  id: string
): Promise<ObraSocialWithRelations | null> {
  try {
    const os = await prisma.obraSocial.findUnique({
      where: { id },
    })
    if (!os) return null
    return {
      id: os.id,
      nombre: os.nombre,
      codigo: os.codigo,
      descripcion: os.descripcion,
      telefono: os.telefono,
      email: os.email,
      direccion: os.direccion,
      activa: os.activa,
      createdAt: os.createdAt,
      updatedAt: os.updatedAt,
    }
  } catch (error) {
    console.error("Error en getObraSocialById:", error)
    throw error
  }
}

/**
 * Obtener una obra social por nombre (Prisma). Requiere clinicId por @@unique([clinicId, nombre]).
 */
export async function getObraSocialByNombre(
  nombre: string,
  clinicId: string
): Promise<ObraSocialWithRelations | null> {
  try {
    const os = await prisma.obraSocial.findUnique({
      where: { clinicId_nombre: { clinicId, nombre } },
    })
    if (!os) return null
    return {
      id: os.id,
      nombre: os.nombre,
      codigo: os.codigo,
      descripcion: os.descripcion,
      telefono: os.telefono,
      email: os.email,
      direccion: os.direccion,
      activa: os.activa,
      createdAt: os.createdAt,
      updatedAt: os.updatedAt,
    }
  } catch (error) {
    console.error("Error en getObraSocialByNombre:", error)
    throw error
  }
}

/**
 * Obtener una obra social por código en una clínica (Prisma)
 */
export async function getObraSocialByCodigo(
  codigo: string,
  clinicId: string
): Promise<ObraSocialWithRelations | null> {
  try {
    const os = await prisma.obraSocial.findFirst({
      where: { codigo, clinicId },
    })
    if (!os) return null
    return {
      id: os.id,
      nombre: os.nombre,
      codigo: os.codigo,
      descripcion: os.descripcion,
      telefono: os.telefono,
      email: os.email,
      direccion: os.direccion,
      activa: os.activa,
      createdAt: os.createdAt,
      updatedAt: os.updatedAt,
    }
  } catch (error) {
    console.error("Error en getObraSocialByCodigo:", error)
    throw error
  }
}
