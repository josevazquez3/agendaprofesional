/**
 * Subscription Middleware
 * Valida que la clínica tenga suscripción activa antes de permitir acciones
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isSubscriptionActive } from "./lib/subscription"
import { getClinicId } from "./lib/clinic-context"

/**
 * Middleware para validar suscripción activa
 * Usar en rutas críticas que requieren suscripción activa
 */
export async function validateSubscription(request: NextRequest) {
  // Solo aplicar en rutas del dashboard
  if (!request.nextUrl.pathname.startsWith("/dashboard")) {
    return null
  }

  try {
    const clinicId = await getClinicId()
    if (!clinicId) {
      return NextResponse.json(
        { error: "No se pudo determinar la clínica" },
        { status: 403 }
      )
    }

    const isActive = await isSubscriptionActive(clinicId)
    if (!isActive) {
      // Permitir acceso a página de plan para actualizar
      if (request.nextUrl.pathname.includes("/plan")) {
        return null
      }

      return NextResponse.json(
        {
          error: "Tu suscripción no está activa",
          code: "SUBSCRIPTION_INACTIVE",
        },
        { status: 403 }
      )
    }

    return null
  } catch (error) {
    console.error("Error validando suscripción:", error)
    return null // En caso de error, permitir acceso (fallback)
  }
}
