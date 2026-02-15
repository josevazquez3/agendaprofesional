/**
 * Billing Adapter
 * Integración real con Stripe para gestión de pagos y suscripciones
 */

import Stripe from "stripe"
import { prisma } from "./prisma"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY no está configurada en variables de entorno")
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
})

export interface StripeCustomer {
  id: string
  email: string
  name?: string
}

export interface StripeSubscription {
  id: string
  status: string
  current_period_end: number
  plan: {
    id: string
    amount: number
  }
}

/**
 * Crear cliente en Stripe
 */
export async function createCustomer(
  clinicId: string,
  email: string,
  name: string
): Promise<StripeCustomer> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      clinicId,
    },
  })

  return {
    id: customer.id,
    email: customer.email || email,
    name: customer.name || name,
  }
}

/**
 * Crear suscripción en Stripe
 * @param customerId ID del cliente en Stripe
 * @param priceId ID del precio (price_xxx) en Stripe
 */
export async function createSubscription(
  customerId: string,
  priceId: string
): Promise<StripeSubscription> {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
  })

  return {
    id: subscription.id,
    status: subscription.status,
    current_period_end: subscription.current_period_end,
    plan: {
      id: subscription.items.data[0]?.price.id || priceId,
      amount: subscription.items.data[0]?.price.unit_amount || 0,
    },
  }
}

/**
 * Cancelar suscripción en Stripe
 * Cancela inmediatamente la suscripción
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<void> {
  await stripe.subscriptions.cancel(subscriptionId)
}

/**
 * Actualizar plan de suscripción en Stripe
 * STUB: Preparado para integración futura
 */
export async function updateSubscriptionPlan(
  subscriptionId: string,
  newPlanId: string
): Promise<StripeSubscription> {
  // TODO: Integrar con Stripe
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // const subscription = await stripe.subscriptions.update(subscriptionId, {
  //   items: [{
  //     id: subscription.items.data[0].id,
  //     price: newPlanId,
  //   }],
  // })
  // return {
  //   id: subscription.id,
  //   status: subscription.status,
  //   current_period_end: subscription.current_period_end,
  //   plan: {
  //     id: subscription.items.data[0].price.id,
  //     amount: subscription.items.data[0].price.unit_amount || 0,
  //   },
  // }

  return {
    id: subscriptionId,
    status: "active",
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    plan: {
      id: newPlanId,
      amount: 0,
    },
  }
}

/**
 * Obtener suscripción de Stripe
 */
export async function getStripeSubscription(
  subscriptionId: string
): Promise<StripeSubscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    return {
      id: subscription.id,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      plan: {
        id: subscription.items.data[0]?.price.id || "",
        amount: subscription.items.data[0]?.price.unit_amount || 0,
      },
    }
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError && error.code === "resource_missing") {
      return null
    }
    throw error
  }
}
