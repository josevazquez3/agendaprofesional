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
 * Obtener obras sociales usando SQL raw
 */
export async function getObrasSociales(options?: {
  activa?: boolean
  includeCounts?: boolean
  orderBy?: { nombre?: "asc" | "desc" }
}): Promise<ObraSocialWithRelations[]> {
  try {
    let whereClause = ""
    const params: any[] = []

    if (options?.activa !== undefined) {
      whereClause = "WHERE activa = ?"
      params.push(options.activa ? 1 : 0)
    }

    let orderByClause = "ORDER BY nombre ASC"
    if (options?.orderBy?.nombre) {
      orderByClause = `ORDER BY nombre ${options.orderBy.nombre.toUpperCase()}`
    }

    const query = `
      SELECT 
        id, nombre, codigo, descripcion, telefono, email, direccion, 
        activa, createdAt, updatedAt
      FROM ObraSocial
      ${whereClause}
      ${orderByClause}
    `

    const obrasSociales = await prisma.$queryRawUnsafe<Array<{
      id: string
      nombre: string
      codigo: string | null
      descripcion: string | null
      telefono: string | null
      email: string | null
      direccion: string | null
      activa: number | boolean
      createdAt: string | bigint | number
      updatedAt: string | bigint | number
    }>>(query, ...params)

    if (obrasSociales.length === 0) {
      return []
    }

    // Obtener conteos si se requiere
    let countsMap = new Map<string, { pacientes: number; turnos: number }>()
    if (options?.includeCounts) {
      const obraSocialIds = obrasSociales.map((os) => os.id)
      if (obraSocialIds.length > 0) {
        const placeholders = obraSocialIds.map(() => "?").join(",")
        
        // Contar pacientes
        const pacientesCounts = await prisma.$queryRawUnsafe<Array<{
          obraSocialId: string
          count: bigint | number
        }>>(
          `SELECT obraSocialId, COUNT(*) as count
           FROM User
           WHERE obraSocialId IN (${placeholders}) AND role = 'PACIENTE'
           GROUP BY obraSocialId`,
          ...obraSocialIds
        )

        // Contar turnos - obtener nombres de obras sociales primero
        const nombresObrasSociales = obrasSociales.map((os) => os.nombre)
        let turnosCounts: Array<{ obraSocial: string | null; count: bigint | number }> = []
        if (nombresObrasSociales.length > 0) {
          const nombrePlaceholders = nombresObrasSociales.map(() => "?").join(",")
          turnosCounts = await prisma.$queryRawUnsafe<Array<{
            obraSocial: string | null
            count: bigint | number
          }>>(
            `SELECT obraSocial, COUNT(*) as count
             FROM Turno
             WHERE obraSocial IN (${nombrePlaceholders})
             GROUP BY obraSocial`,
            ...nombresObrasSociales
          )
        }

        // Crear mapas de conteos
        pacientesCounts.forEach((pc) => {
          const count = typeof pc.count === 'bigint' ? Number(pc.count) : pc.count
          if (!countsMap.has(pc.obraSocialId)) {
            countsMap.set(pc.obraSocialId, { pacientes: 0, turnos: 0 })
          }
          countsMap.get(pc.obraSocialId)!.pacientes = count
        })

        // Mapear nombres de obras sociales a IDs para turnos
        const nombreToIdMap = new Map(
          obrasSociales.map((os) => [os.nombre, os.id])
        )
        turnosCounts.forEach((tc) => {
          if (tc.obraSocial) {
            const obraSocialId = nombreToIdMap.get(tc.obraSocial)
            if (obraSocialId) {
              const count = typeof tc.count === 'bigint' ? Number(tc.count) : tc.count
              if (!countsMap.has(obraSocialId)) {
                countsMap.set(obraSocialId, { pacientes: 0, turnos: 0 })
              }
              countsMap.get(obraSocialId)!.turnos = count
            }
          }
        })
      }
    }

    // Formatear resultados
    return obrasSociales.map((os) => ({
      id: os.id,
      nombre: os.nombre,
      codigo: os.codigo,
      descripcion: os.descripcion,
      telefono: os.telefono,
      email: os.email,
      direccion: os.direccion,
      activa: typeof os.activa === 'number' ? os.activa === 1 : os.activa,
      createdAt: safeDate(os.createdAt) || new Date(),
      updatedAt: safeDate(os.updatedAt) || new Date(),
      _count: options?.includeCounts && countsMap.has(os.id)
        ? countsMap.get(os.id)!
        : undefined,
    }))
  } catch (error) {
    console.error("Error en getObrasSociales:", error)
    throw error
  }
}

/**
 * Obtener una obra social por ID usando SQL raw
 */
export async function getObraSocialById(
  id: string
): Promise<ObraSocialWithRelations | null> {
  try {
    const query = `
      SELECT 
        id, nombre, codigo, descripcion, telefono, email, direccion, 
        activa, createdAt, updatedAt
      FROM ObraSocial
      WHERE id = ?
      LIMIT 1
    `

    const result = await prisma.$queryRawUnsafe<Array<{
      id: string
      nombre: string
      codigo: string | null
      descripcion: string | null
      telefono: string | null
      email: string | null
      direccion: string | null
      activa: number | boolean
      createdAt: string | bigint | number
      updatedAt: string | bigint | number
    }>>(query, id)

    if (result.length === 0) {
      return null
    }

    const os = result[0]
    return {
      id: os.id,
      nombre: os.nombre,
      codigo: os.codigo,
      descripcion: os.descripcion,
      telefono: os.telefono,
      email: os.email,
      direccion: os.direccion,
      activa: typeof os.activa === 'number' ? os.activa === 1 : os.activa,
      createdAt: safeDate(os.createdAt) || new Date(),
      updatedAt: safeDate(os.updatedAt) || new Date(),
    }
  } catch (error) {
    console.error("Error en getObraSocialById:", error)
    throw error
  }
}

/**
 * Obtener una obra social por nombre usando SQL raw
 */
export async function getObraSocialByNombre(
  nombre: string
): Promise<ObraSocialWithRelations | null> {
  try {
    const query = `
      SELECT 
        id, nombre, codigo, descripcion, telefono, email, direccion, 
        activa, createdAt, updatedAt
      FROM ObraSocial
      WHERE nombre = ?
      LIMIT 1
    `

    const result = await prisma.$queryRawUnsafe<Array<{
      id: string
      nombre: string
      codigo: string | null
      descripcion: string | null
      telefono: string | null
      email: string | null
      direccion: string | null
      activa: number | boolean
      createdAt: string | bigint | number
      updatedAt: string | bigint | number
    }>>(query, nombre)

    if (result.length === 0) {
      return null
    }

    const os = result[0]
    return {
      id: os.id,
      nombre: os.nombre,
      codigo: os.codigo,
      descripcion: os.descripcion,
      telefono: os.telefono,
      email: os.email,
      direccion: os.direccion,
      activa: typeof os.activa === 'number' ? os.activa === 1 : os.activa,
      createdAt: safeDate(os.createdAt) || new Date(),
      updatedAt: safeDate(os.updatedAt) || new Date(),
    }
  } catch (error) {
    console.error("Error en getObraSocialByNombre:", error)
    throw error
  }
}

/**
 * Obtener una obra social por código usando SQL raw
 */
export async function getObraSocialByCodigo(
  codigo: string
): Promise<ObraSocialWithRelations | null> {
  try {
    const query = `
      SELECT 
        id, nombre, codigo, descripcion, telefono, email, direccion, 
        activa, createdAt, updatedAt
      FROM ObraSocial
      WHERE codigo = ?
      LIMIT 1
    `

    const result = await prisma.$queryRawUnsafe<Array<{
      id: string
      nombre: string
      codigo: string | null
      descripcion: string | null
      telefono: string | null
      email: string | null
      direccion: string | null
      activa: number | boolean
      createdAt: string | bigint | number
      updatedAt: string | bigint | number
    }>>(query, codigo)

    if (result.length === 0) {
      return null
    }

    const os = result[0]
    return {
      id: os.id,
      nombre: os.nombre,
      codigo: os.codigo,
      descripcion: os.descripcion,
      telefono: os.telefono,
      email: os.email,
      direccion: os.direccion,
      activa: typeof os.activa === 'number' ? os.activa === 1 : os.activa,
      createdAt: safeDate(os.createdAt) || new Date(),
      updatedAt: safeDate(os.updatedAt) || new Date(),
    }
  } catch (error) {
    console.error("Error en getObraSocialByCodigo:", error)
    throw error
  }
}
