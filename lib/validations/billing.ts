import { z } from "zod"

/**
 * Validaciones Zod para billing y planes
 */

export const createPlanSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  precioMensual: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  limiteUsuarios: z.number().int().min(-1, "El límite debe ser -1 (ilimitado) o mayor a 0"),
  limiteProfesionales: z.number().int().min(-1, "El límite debe ser -1 (ilimitado) o mayor a 0"),
  limiteTurnosMes: z.number().int().min(-1, "El límite debe ser -1 (ilimitado) o mayor a 0"),
  storageLimitMb: z.number().int().min(0, "El límite de almacenamiento debe ser mayor o igual a 0"),
  activo: z.boolean().default(true),
})

export const updatePlanSchema = createPlanSchema.partial()

export const changePlanSchema = z.object({
  planId: z.string().min(1, "El planId es requerido"),
})

export const createSubscriptionSchema = z.object({
  clinicId: z.string().min(1, "El clinicId es requerido"),
  planId: z.string().min(1, "El planId es requerido"),
  status: z.enum(["active", "trial", "past_due", "canceled"]).default("trial"),
  periodDays: z.number().int().min(1).max(365).default(30),
})
