/**
 * Smart Defaults Clínicos
 * Reducir tipeo manual con valores inteligentes
 */

import { prisma } from "./prisma"

export interface SmartDefaults {
  ultimoProfesionalId?: string | null
  duracionTipica?: number
  ultimaObraSocialId?: string | null
}

/**
 * Obtener smart defaults para un usuario
 */
export async function getSmartDefaults(
  userId: string
): Promise<SmartDefaults> {
  try {
    // Obtener último turno creado por el usuario
    const ultimoTurno = await prisma.turno.findFirst({
      where: {
        paciente: {
          id: userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        profesional: true,
        paciente: {
          include: {
            obraSocialRel: true,
          },
        },
      },
    })

    // Duración típica: por defecto 30 (ConfiguracionClinica es por clínica, no por usuario)
    return {
      ultimoProfesionalId: ultimoTurno?.profesionalId || null,
      duracionTipica: 30,
      ultimaObraSocialId: ultimoTurno?.paciente?.obraSocialId || null,
    }
  } catch (error) {
    console.error("Error obteniendo smart defaults:", error)
    return {
      ultimoProfesionalId: null,
      duracionTipica: 30,
      ultimaObraSocialId: null,
    }
  }
}

/**
 * Guardar smart defaults después de una acción
 */
export async function saveSmartDefaults(
  userId: string,
  defaults: Partial<SmartDefaults>
) {
  try {
    // Guardar en localStorage del cliente (más rápido)
    // En producción, podría guardarse en DB para persistencia entre dispositivos
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `smart_defaults_${userId}`,
        JSON.stringify(defaults)
      )
    }
  } catch (error) {
    console.error("Error guardando smart defaults:", error)
  }
}

/**
 * Obtener smart defaults del localStorage
 */
export function getSmartDefaultsFromStorage(
  userId: string
): SmartDefaults | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(`smart_defaults_${userId}`)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}
