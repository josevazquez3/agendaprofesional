/**
 * Prisma Clinic Helper
 * Extensión de Prisma para filtrar automáticamente por clinicId
 */

import { Prisma } from "@prisma/client"
import { getClinicId } from "./clinic-context"

/**
 * Agregar filtro clinicId a un where clause
 */
export async function withClinicFilter<T extends { clinicId?: string }>(
  where: T
): Promise<T & { clinicId: string }> {
  const clinicId = await getClinicId()
  if (!clinicId) {
    throw new Error("No se pudo determinar la clínica activa")
  }
  return {
    ...where,
    clinicId,
  }
}

/**
 * Crear un where clause con clinicId
 */
export async function createClinicWhere(
  additionalWhere: Prisma.JsonObject = {}
): Promise<Prisma.JsonObject> {
  const clinicId = await getClinicId()
  if (!clinicId) {
    throw new Error("No se pudo determinar la clínica activa")
  }
  return {
    ...additionalWhere,
    clinicId,
  }
}
