/**
 * Subscription Management
 * Gestión de suscripciones y validación de estado
 */

import { prisma } from "./prisma"

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trial"

export interface ClinicSubscription {
  id: string
  clinicId: string
  planId: string
  plan: {
    nombre: string
    precioMensual: number
  }
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  canceledAt: Date | null
}

/**
 * Obtener suscripción activa de una clínica
 */
export async function getClinicSubscription(
  clinicId: string
): Promise<ClinicSubscription | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { clinicId },
    include: {
      plan: {
        select: {
          nombre: true,
          precioMensual: true,
        },
      },
    },
  })

  if (!subscription) {
    return null
  }

  return {
    id: subscription.id,
    clinicId: subscription.clinicId,
    planId: subscription.planId,
    plan: {
      nombre: subscription.plan.nombre,
      precioMensual: subscription.plan.precioMensual,
    },
    status: subscription.status as SubscriptionStatus,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    canceledAt: subscription.canceledAt,
  }
}

/**
 * Verificar si la suscripción está activa
 */
export async function isSubscriptionActive(clinicId: string): Promise<boolean> {
  const subscription = await getClinicSubscription(clinicId)

  if (!subscription) {
    return false
  }

  // Verificar que esté activa y no haya expirado
  const ahora = new Date()
  const isActiveStatus = subscription.status === "active" || subscription.status === "trial"
  const isNotExpired = subscription.currentPeriodEnd > ahora

  return isActiveStatus && isNotExpired
}

/**
 * Crear suscripción inicial (trial o activa)
 */
export async function createSubscription(
  clinicId: string,
  planId: string,
  status: SubscriptionStatus = "trial",
  periodDays: number = 30
): Promise<ClinicSubscription> {
  const ahora = new Date()
  const periodEnd = new Date(ahora)
  periodEnd.setDate(periodEnd.getDate() + periodDays)

  const subscription = await prisma.subscription.create({
    data: {
      clinicId,
      planId,
      status,
      currentPeriodStart: ahora,
      currentPeriodEnd: periodEnd,
    },
    include: {
      plan: {
        select: {
          nombre: true,
          precioMensual: true,
        },
      },
    },
  })

  // Actualizar planId en Clinic
  await prisma.clinic.update({
    where: { id: clinicId },
    data: { planId },
  })

  return {
    id: subscription.id,
    clinicId: subscription.clinicId,
    planId: subscription.planId,
    plan: {
      nombre: subscription.plan.nombre,
      precioMensual: subscription.plan.precioMensual,
    },
    status: subscription.status as SubscriptionStatus,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    canceledAt: subscription.canceledAt,
  }
}

/**
 * Actualizar plan de suscripción
 */
export async function updateSubscriptionPlan(
  clinicId: string,
  newPlanId: string
): Promise<ClinicSubscription> {
  const subscription = await prisma.subscription.update({
    where: { clinicId },
    data: {
      planId: newPlanId,
      // Reiniciar período si es cambio de plan
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    include: {
      plan: {
        select: {
          nombre: true,
          precioMensual: true,
        },
      },
    },
  })

  // Actualizar planId en Clinic
  await prisma.clinic.update({
    where: { id: clinicId },
    data: { planId: newPlanId },
  })

  return {
    id: subscription.id,
    clinicId: subscription.clinicId,
    planId: subscription.planId,
    plan: {
      nombre: subscription.plan.nombre,
      precioMensual: subscription.plan.precioMensual,
    },
    status: subscription.status as SubscriptionStatus,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    canceledAt: subscription.canceledAt,
  }
}

/**
 * Cancelar suscripción
 */
export async function cancelSubscription(clinicId: string): Promise<void> {
  await prisma.subscription.update({
    where: { clinicId },
    data: {
      status: "canceled",
      canceledAt: new Date(),
    },
  })
}
