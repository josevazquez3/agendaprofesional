import { z } from "zod"

/**
 * Validaciones Zod para backups
 */

export const createBackupJobSchema = z.object({
  clinicId: z.string().min(1, "El clinicId es requerido"),
  frequency: z.enum(["manual", "daily", "weekly", "monthly"], {
    errorMap: () => ({ message: "Frecuencia inválida" }),
  }),
  scheduledTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (debe ser HH:mm)",
  }).optional(),
  scheduledDay: z.number().int().min(0).max(31).optional(),
  storageType: z.enum(["local", "s3", "gcs"]).default("local"),
  storagePath: z.string().optional(),
})

export const updateBackupJobSchema = createBackupJobSchema.partial()

export const runBackupSchema = z.object({
  jobId: z.string().min(1, "El jobId es requerido").optional(),
  clinicId: z.string().min(1, "El clinicId es requerido").optional(),
  storageType: z.enum(["local", "s3", "gcs"]).optional(),
  storagePath: z.string().optional(),
})
