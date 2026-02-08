import { z } from "zod"

/**
 * Validaciones Zod para auditorías
 */

export const auditFilterSchema = z.object({
  userId: z.string().optional(),
  action: z
    .enum([
      "CREATE",
      "UPDATE",
      "DELETE",
      "LOGIN",
      "LOGOUT",
      "EXPORT",
      "DOWNLOAD",
      "PERMISSION_CHANGE",
    ])
    .optional(),
  entityType: z
    .enum([
      "PATIENT",
      "APPOINTMENT",
      "MEDICAL_RECORD",
      "USER",
      "BILLING",
      "SETTINGS",
      "FILE",
      "BACKUP",
      "PLAN",
    ])
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
})

export const auditExportSchema = z.object({
  userId: z.string().optional(),
  action: z
    .enum([
      "CREATE",
      "UPDATE",
      "DELETE",
      "LOGIN",
      "LOGOUT",
      "EXPORT",
      "DOWNLOAD",
      "PERMISSION_CHANGE",
    ])
    .optional(),
  entityType: z
    .enum([
      "PATIENT",
      "APPOINTMENT",
      "MEDICAL_RECORD",
      "USER",
      "BILLING",
      "SETTINGS",
      "FILE",
      "BACKUP",
      "PLAN",
    ])
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})
