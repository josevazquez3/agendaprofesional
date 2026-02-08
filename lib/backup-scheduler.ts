/**
 * Backup Scheduler
 * Sistema para ejecutar backups automáticos según frecuencia configurada
 */

import { prisma } from "./prisma"
import { runBackupJob } from "./backup-service"

/**
 * Verificar si un job debe ejecutarse ahora
 */
export async function shouldRunBackupJob(job: {
  frequency: string
  scheduledTime: string | null
  scheduledDay: number | null
  lastRunAt: Date | null
}): Promise<boolean> {
  const ahora = new Date()
  const horaActual = ahora.getHours() * 60 + ahora.getMinutes() // Minutos desde medianoche

  switch (job.frequency) {
    case "manual":
      return false // Los manuales no se ejecutan automáticamente

    case "daily":
      if (!job.scheduledTime) return false
      const [scheduledHour, scheduledMinute] = job.scheduledTime.split(":").map(Number)
      const scheduledMinutes = scheduledHour * 60 + scheduledMinute

      // Ejecutar si es la hora programada y no se ejecutó hoy
      if (horaActual >= scheduledMinutes && horaActual < scheduledMinutes + 60) {
        if (!job.lastRunAt) return true
        const lastRun = new Date(job.lastRunAt)
        const hoy = new Date()
        return (
          lastRun.getDate() !== hoy.getDate() ||
          lastRun.getMonth() !== hoy.getMonth() ||
          lastRun.getFullYear() !== hoy.getFullYear()
        )
      }
      return false

    case "weekly":
      if (!job.scheduledTime || job.scheduledDay === null) return false
      const [weeklyHour, weeklyMinute] = job.scheduledTime.split(":").map(Number)
      const weeklyScheduledMinutes = weeklyHour * 60 + weeklyMinute

      // Ejecutar si es el día de la semana programado y la hora
      const dayOfWeek = ahora.getDay() === 0 ? 6 : ahora.getDay() - 1 // Lunes = 0, Domingo = 6

      if (
        dayOfWeek === job.scheduledDay &&
        horaActual >= weeklyScheduledMinutes &&
        horaActual < weeklyScheduledMinutes + 60
      ) {
        if (!job.lastRunAt) return true
        const lastRun = new Date(job.lastRunAt)
        const daysSinceLastRun = Math.floor(
          (ahora.getTime() - lastRun.getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysSinceLastRun >= 7
      }
      return false

    case "monthly":
      if (!job.scheduledTime || job.scheduledDay === null) return false
      const [monthlyHour, monthlyMinute] = job.scheduledTime.split(":").map(Number)
      const monthlyScheduledMinutes = monthlyHour * 60 + monthlyMinute

      // Ejecutar si es el día del mes programado y la hora
      if (
        ahora.getDate() === job.scheduledDay &&
        horaActual >= monthlyScheduledMinutes &&
        horaActual < monthlyScheduledMinutes + 60
      ) {
        if (!job.lastRunAt) return true
        const lastRun = new Date(job.lastRunAt)
        return (
          lastRun.getMonth() !== ahora.getMonth() ||
          lastRun.getFullYear() !== ahora.getFullYear()
        )
      }
      return false

    default:
      return false
  }
}

/**
 * Ejecutar todos los backup jobs que correspondan
 */
export async function runScheduledBackups(): Promise<void> {
  const activeJobs = await prisma.backupJob.findMany({
    where: {
      status: "active",
      frequency: {
        not: "manual",
      },
    },
  })

  console.log(`🔄 Verificando ${activeJobs.length} backup jobs activos...`)

  for (const job of activeJobs) {
    try {
      const shouldRun = await shouldRunBackupJob(job)

      if (shouldRun) {
        console.log(`▶️ Ejecutando backup job: ${job.id} (${job.frequency})`)
        await runBackupJob(job.id)
        console.log(`✅ Backup job completado: ${job.id}`)
      }
    } catch (error) {
      console.error(`❌ Error ejecutando backup job ${job.id}:`, error)
      // Continuar con otros jobs aunque uno falle
    }
  }
}
