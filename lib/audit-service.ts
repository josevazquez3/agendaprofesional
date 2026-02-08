/**
 * Audit Service
 * Servicio completo para registrar y gestionar logs de auditoría
 */

import { prisma } from "./prisma"
import { NextRequest } from "next/server"

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "EXPORT"
  | "DOWNLOAD"
  | "PERMISSION_CHANGE"

export type AuditEntityType =
  | "PATIENT"
  | "APPOINTMENT"
  | "MEDICAL_RECORD"
  | "USER"
  | "BILLING"
  | "SETTINGS"
  | "FILE"
  | "BACKUP"
  | "PLAN"

export interface AuditLogData {
  clinicId: string
  userId: string
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string | null
  oldValues?: Record<string, any> | null
  newValues?: Record<string, any> | null
  request?: NextRequest | Request | null
}

/**
 * Obtener IP y User-Agent de una request
 */
function getRequestMetadata(request?: NextRequest | Request | null): {
  ipAddress: string | null
  userAgent: string | null
} {
  if (!request) {
    return { ipAddress: null, userAgent: null }
  }

  // Obtener IP (soporta headers de proxy)
  let ipAddress: string | null = null
  if (request instanceof NextRequest) {
    ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      request.ip ||
      null
  } else {
    const headers = request.headers as any
    ipAddress =
      headers["x-forwarded-for"]?.split(",")[0] ||
      headers["x-real-ip"] ||
      null
  }

  // Obtener User-Agent
  const userAgent =
    request instanceof NextRequest
      ? request.headers.get("user-agent")
      : (request.headers as any)["user-agent"] || null

  return { ipAddress, userAgent }
}

/**
 * Registrar una acción de auditoría
 */
export async function logAction(data: AuditLogData): Promise<void> {
  try {
    const { ipAddress, userAgent } = getRequestMetadata(data.request)

    await prisma.auditLog.create({
      data: {
        clinicId: data.clinicId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || null,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
        newValues: data.newValues ? JSON.stringify(data.newValues) : null,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    // No lanzar error para no interrumpir el flujo principal
    // Solo loggear en consola para debugging
    console.error("Error registrando auditoría:", error)
  }
}

/**
 * Registrar creación de entidad
 */
export async function logCreate(
  clinicId: string,
  userId: string,
  entityType: AuditEntityType,
  entityId: string,
  newValues: Record<string, any>,
  request?: NextRequest | Request | null
): Promise<void> {
  await logAction({
    clinicId,
    userId,
    action: "CREATE",
    entityType,
    entityId,
    newValues,
    request,
  })
}

/**
 * Registrar actualización de entidad
 */
export async function logUpdate(
  clinicId: string,
  userId: string,
  entityType: AuditEntityType,
  entityId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  request?: NextRequest | Request | null
): Promise<void> {
  await logAction({
    clinicId,
    userId,
    action: "UPDATE",
    entityType,
    entityId,
    oldValues,
    newValues,
    request,
  })
}

/**
 * Registrar eliminación de entidad
 */
export async function logDelete(
  clinicId: string,
  userId: string,
  entityType: AuditEntityType,
  entityId: string,
  oldValues: Record<string, any>,
  request?: NextRequest | Request | null
): Promise<void> {
  await logAction({
    clinicId,
    userId,
    action: "DELETE",
    entityType,
    entityId,
    oldValues,
    request,
  })
}

/**
 * Registrar login
 */
export async function logLogin(
  clinicId: string,
  userId: string,
  request?: NextRequest | Request | null
): Promise<void> {
  await logAction({
    clinicId,
    userId,
    action: "LOGIN",
    entityType: "USER",
    entityId: userId,
    request,
  })
}

/**
 * Registrar logout
 */
export async function logLogout(
  clinicId: string,
  userId: string,
  request?: NextRequest | Request | null
): Promise<void> {
  await logAction({
    clinicId,
    userId,
    action: "LOGOUT",
    entityType: "USER",
    entityId: userId,
    request,
  })
}

/**
 * Registrar exportación
 */
export async function logExport(
  clinicId: string,
  userId: string,
  entityType: AuditEntityType,
  request?: NextRequest | Request | null
): Promise<void> {
  await logAction({
    clinicId,
    userId,
    action: "EXPORT",
    entityType,
    request,
  })
}

/**
 * Registrar descarga
 */
export async function logDownload(
  clinicId: string,
  userId: string,
  entityType: AuditEntityType,
  entityId: string,
  request?: NextRequest | Request | null
): Promise<void> {
  await logAction({
    clinicId,
    userId,
    action: "DOWNLOAD",
    entityType,
    entityId,
    request,
  })
}

/**
 * Registrar cambio de permisos
 */
export async function logPermissionChange(
  clinicId: string,
  userId: string,
  targetUserId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  request?: NextRequest | Request | null
): Promise<void> {
  await logAction({
    clinicId,
    userId,
    action: "PERMISSION_CHANGE",
    entityType: "USER",
    entityId: targetUserId,
    oldValues,
    newValues,
    request,
  })
}
