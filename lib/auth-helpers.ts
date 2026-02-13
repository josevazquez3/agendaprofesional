/**
 * Auth Helpers
 * Funciones centralizadas para autenticación y autorización
 * 
 * Objetivo: Reducir duplicación de código y unificar validaciones de permisos
 */

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { Session } from "next-auth"
import { getActiveClinic, getClinicId } from "./clinic-context"

export type UserRole = "ADMIN" | "SECRETARIA" | "PROFESIONAL" | "PACIENTE" | "OWNER"

export interface AuthResult {
  session: Session
  clinicId: string | null
  allowed: boolean
  error?: NextResponse
}

/**
 * Verificar autenticación básica
 */
export async function requireAuth(): Promise<AuthResult | null> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      session: null as any,
      clinicId: null,
      allowed: false,
      error: NextResponse.json(
        { error: "No autorizado. Debe iniciar sesión." },
        { status: 401 }
      ),
    }
  }

  const clinicId = await getClinicId()

  return {
    session,
    clinicId,
    allowed: true,
  }
}

/**
 * Verificar que el usuario tenga uno de los roles especificados
 */
export async function requireRoles(
  allowedRoles: UserRole[]
): Promise<AuthResult | null> {
  const authResult = await requireAuth()

  if (!authResult || !authResult.allowed) {
    return authResult
  }

  const userRole = authResult.session.user.role as UserRole

  if (!allowedRoles.includes(userRole)) {
    return {
      ...authResult,
      allowed: false,
      error: NextResponse.json(
        {
          error: "No autorizado. No tiene permisos suficientes para realizar esta acción.",
          requiredRoles: allowedRoles,
          userRole,
        },
        { status: 403 }
      ),
    }
  }

  return authResult
}

/**
 * Verificar que existe una clínica activa
 */
export async function requireClinic(): Promise<AuthResult | null> {
  const authResult = await requireAuth()

  if (!authResult || !authResult.allowed) {
    return authResult
  }

  if (!authResult.clinicId) {
    return {
      ...authResult,
      allowed: false,
      error: NextResponse.json(
        {
          error: "No se pudo determinar la clínica activa. Por favor, contacte al administrador.",
        },
        { status: 400 }
      ),
    }
  }

  return authResult
}

/**
 * Verificar autenticación + roles + clínica activa
 */
export async function requireAuthWithRolesAndClinic(
  allowedRoles: UserRole[]
): Promise<AuthResult | null> {
  const authResult = await requireRoles(allowedRoles)

  if (!authResult || !authResult.allowed) {
    return authResult
  }

  return requireClinic()
}

/**
 * Verificar ownership: Profesional solo puede acceder a sus propios recursos
 */
export async function verifyProfessionalOwnership(
  profesionalId: string,
  sessionUserId: string
): Promise<boolean> {
  const { prisma } = await import("./prisma")
  const { getProfesionalByUserId } = await import("./profesional-helpers")

  const profesional = await getProfesionalByUserId(sessionUserId)
  return profesional !== null && profesional.id === profesionalId
}

/**
 * Verificar ownership: Paciente solo puede acceder a sus propios recursos
 */
export function verifyPatientOwnership(
  pacienteId: string,
  sessionUserId: string
): boolean {
  return pacienteId === sessionUserId
}

/**
 * Mensajes de error unificados
 */
export const AuthErrors = {
  UNAUTHORIZED: {
    message: "No autorizado. Debe iniciar sesión.",
    status: 401,
  },
  FORBIDDEN: {
    message: "No autorizado. No tiene permisos suficientes para realizar esta acción.",
    status: 403,
  },
  NO_CLINIC: {
    message: "No se pudo determinar la clínica activa. Por favor, contacte al administrador.",
    status: 400,
  },
  NOT_FOUND: {
    message: "Recurso no encontrado.",
    status: 404,
  },
  OWNERSHIP_REQUIRED: {
    message: "No tiene permisos para acceder a este recurso. Solo puede acceder a sus propios recursos.",
    status: 403,
  },
  CONCURRENT_EDIT: {
    message: "Este registro fue modificado por otro usuario. Por favor, recargue la página y vuelva a intentar.",
    status: 409,
  },
}

/**
 * Crear respuesta de error unificada
 */
export function createAuthErrorResponse(
  errorType: keyof typeof AuthErrors,
  additionalInfo?: Record<string, any>
): NextResponse {
  const error = AuthErrors[errorType]
  return NextResponse.json(
    {
      error: error.message,
      ...additionalInfo,
    },
    { status: error.status }
  )
}
