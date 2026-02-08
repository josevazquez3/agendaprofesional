/**
 * Plan Limits Validation
 * Validación de límites de plan antes de crear recursos
 */

import { prisma } from "./prisma"
import { getClinicId } from "./clinic-context"

export interface PlanLimits {
  limiteUsuarios: number
  limiteProfesionales: number
  limiteTurnosMes: number
  storageLimitMb: number
}

export interface CurrentUsage {
  usuarios: number
  profesionales: number
  turnosMes: number
  storageMb: number
}

/**
 * Obtener límites del plan de una clínica
 */
export async function getClinicPlanLimits(
  clinicId: string
): Promise<PlanLimits | null> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      plan: true,
    },
  })

  if (!clinic?.plan) {
    return null
  }

  return {
    limiteUsuarios: clinic.plan.limiteUsuarios,
    limiteProfesionales: clinic.plan.limiteProfesionales,
    limiteTurnosMes: clinic.plan.limiteTurnosMes,
    storageLimitMb: clinic.plan.storageLimitMb,
  }
}

/**
 * Obtener uso actual de una clínica
 */
export async function getClinicCurrentUsage(
  clinicId: string
): Promise<CurrentUsage> {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0)

  const [usuarios, profesionales, turnosMes, storage] = await Promise.all([
    // Usuarios activos (ClinicUser activos)
    prisma.clinicUser.count({
      where: {
        clinicId,
        activo: true,
      },
    }),

    // Profesionales activos
    prisma.profesional.count({
      where: {
        clinicId,
      },
    }),

    // Turnos del mes actual
    prisma.turno.count({
      where: {
        clinicId,
        fecha: {
          gte: inicioMes,
          lte: finMes,
        },
      },
    }),

    // Storage usado (suma de tamaños de archivos)
    prisma.archivoHistoriaClinica.aggregate({
      where: {
        historiaClinica: {
          clinicId,
        },
      },
      _sum: {
        tamano: true,
      },
    }),
  ])

  return {
    usuarios,
    profesionales,
    turnosMes,
    storageMb: Math.round((storage._sum.tamano || 0) / 1024 / 1024), // Convertir bytes a MB
  }
}

/**
 * Verificar si se puede crear un usuario
 */
export async function canCreateUser(clinicId: string): Promise<{
  allowed: boolean
  reason?: string
  current: number
  limit: number
}> {
  const limits = await getClinicPlanLimits(clinicId)
  if (!limits) {
    return { allowed: false, reason: "No hay plan asignado", current: 0, limit: 0 }
  }

  const usage = await getClinicCurrentUsage(clinicId)

  // -1 significa ilimitado
  if (limits.limiteUsuarios !== -1 && usage.usuarios >= limits.limiteUsuarios) {
    return {
      allowed: false,
      reason: "Has alcanzado el límite de usuarios de tu plan",
      current: usage.usuarios,
      limit: limits.limiteUsuarios,
    }
  }

  return {
    allowed: true,
    current: usage.usuarios,
    limit: limits.limiteUsuarios,
  }
}

/**
 * Verificar si se puede crear un profesional
 */
export async function canCreateProfessional(clinicId: string): Promise<{
  allowed: boolean
  reason?: string
  current: number
  limit: number
}> {
  const limits = await getClinicPlanLimits(clinicId)
  if (!limits) {
    return { allowed: false, reason: "No hay plan asignado", current: 0, limit: 0 }
  }

  const usage = await getClinicCurrentUsage(clinicId)

  // -1 significa ilimitado
  if (limits.limiteProfesionales !== -1 && usage.profesionales >= limits.limiteProfesionales) {
    return {
      allowed: false,
      reason: "Has alcanzado el límite de profesionales de tu plan",
      current: usage.profesionales,
      limit: limits.limiteProfesionales,
    }
  }

  return {
    allowed: true,
    current: usage.profesionales,
    limit: limits.limiteProfesionales,
  }
}

/**
 * Verificar si se puede crear un turno
 */
export async function canCreateAppointment(clinicId: string): Promise<{
  allowed: boolean
  reason?: string
  current: number
  limit: number
}> {
  const limits = await getClinicPlanLimits(clinicId)
  if (!limits) {
    return { allowed: false, reason: "No hay plan asignado", current: 0, limit: 0 }
  }

  const usage = await getClinicCurrentUsage(clinicId)

  // -1 significa ilimitado
  if (limits.limiteTurnosMes !== -1 && usage.turnosMes >= limits.limiteTurnosMes) {
    return {
      allowed: false,
      reason: "Has alcanzado el límite de turnos mensuales de tu plan",
      current: usage.turnosMes,
      limit: limits.limiteTurnosMes,
    }
  }

  return {
    allowed: true,
    current: usage.turnosMes,
    limit: limits.limiteTurnosMes,
  }
}

/**
 * Verificar si está cerca del límite (80% o más)
 */
export async function isNearLimit(
  clinicId: string,
  resource: "usuarios" | "profesionales" | "turnosMes"
): Promise<boolean> {
  const limits = await getClinicPlanLimits(clinicId)
  if (!limits) return false

  const usage = await getClinicCurrentUsage(clinicId)

  let current: number
  let limit: number

  switch (resource) {
    case "usuarios":
      current = usage.usuarios
      limit = limits.limiteUsuarios
      break
    case "profesionales":
      current = usage.profesionales
      limit = limits.limiteProfesionales
      break
    case "turnosMes":
      current = usage.turnosMes
      limit = limits.limiteTurnosMes
      break
  }

  // -1 significa ilimitado, nunca está cerca del límite
  if (limit === -1) return false

  return current >= limit * 0.8
}
