/**
 * Subscription Middleware
 * Valida que la clínica tenga suscripción activa antes de permitir acciones
 * 
 * NOTA: Este middleware debe ser usado dentro de API routes o server components,
 * NO directamente en el middleware de Next.js, ya que requiere acceso a sesión.
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isSubscriptionActive } from "./lib/subscription"
import { getActiveClinic } from "./lib/clinic-context"

/**
 * Middleware para validar suscripción activa
 * Usar en rutas críticas que requieren suscripción activa
 * 
 * IMPORTANTE: Solo usar dentro de API routes o server components que tengan acceso a sesión
 */
export async function validateSubscription(request: NextRequest): Promise<NextResponse | null> {
  // Solo aplicar en rutas del dashboard
  if (!request.nextUrl.pathname.startsWith("/dashboard")) {
    return null
  }

  try {
    // Obtener clínica activa (requiere sesión de servidor)
    const clinic = await getActiveClinic()
    if (!clinic) {
      // Si no hay clínica, permitir acceso (puede ser primera vez o error de configuración)
      return null
    }

    const isActive = await isSubscriptionActive(clinic.id)
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
    // Log error solo en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.error("Error validando suscripción:", error)
    }
    // En caso de error, permitir acceso (fallback para evitar bloqueos)
    return null
  }
}
