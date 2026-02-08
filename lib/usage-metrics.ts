/**
 * Usage Metrics
 * Cálculo y almacenamiento de métricas de consumo diario
 */

import { prisma } from "./prisma"
import { getClinicCurrentUsage } from "./plan-limits"

/**
 * Calcular y guardar métricas diarias de una clínica
 */
export async function calculateAndSaveDailyMetrics(clinicId: string): Promise<void> {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const usage = await getClinicCurrentUsage(clinicId)

  await prisma.clinicUsageDaily.upsert({
    where: {
      clinicId_date: {
        clinicId,
        date: hoy,
      },
    },
    create: {
      clinicId,
      date: hoy,
      usersCount: usage.usuarios,
      professionalsCount: usage.profesionales,
      appointmentsCount: usage.turnosMes,
      storageUsedMb: usage.storageMb,
    },
    update: {
      usersCount: usage.usuarios,
      professionalsCount: usage.profesionales,
      appointmentsCount: usage.turnosMes,
      storageUsedMb: usage.storageMb,
    },
  })
}

/**
 * Calcular métricas para todas las clínicas activas
 * Para ejecutar como cron job diario
 */
export async function calculateAllClinicsMetrics(): Promise<void> {
  const clinics = await prisma.clinic.findMany({
    where: {
      activo: true,
    },
    select: {
      id: true,
    },
  })

  for (const clinic of clinics) {
    try {
      await calculateAndSaveDailyMetrics(clinic.id)
    } catch (error) {
      console.error(`Error calculando métricas para clínica ${clinic.id}:`, error)
    }
  }
}

/**
 * Obtener métricas de una clínica en un rango de fechas
 */
export async function getClinicMetricsRange(
  clinicId: string,
  startDate: Date,
  endDate: Date
) {
  return await prisma.clinicUsageDaily.findMany({
    where: {
      clinicId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: "asc",
    },
  })
}

/**
 * Obtener métricas del mes actual
 */
export async function getCurrentMonthMetrics(clinicId: string) {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0)

  return await getClinicMetricsRange(clinicId, inicioMes, finMes)
}
