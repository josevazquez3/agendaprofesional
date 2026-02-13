import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY no está configurada")
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET no está configurada")
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
})

/**
 * POST /api/webhooks/stripe
 * Webhook handler para eventos de Stripe
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("❌ Error verificando webhook:", err)
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`⚠️ Evento no manejado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Error procesando webhook:", error)
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    )
  }
}

/**
 * Manejar creación de suscripción
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const clinicId = subscription.metadata?.clinicId

  if (!clinicId) {
    console.warn("⚠️ Subscription sin clinicId en metadata")
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  if (!priceId) {
    console.warn("⚠️ Subscription sin priceId")
    return
  }

  // Buscar plan por priceId (asumiendo que priceId está en metadata del plan)
  // Por ahora, actualizar externalSubscriptionId
  await prisma.subscription.upsert({
    where: { clinicId },
    create: {
      clinicId,
      planId: subscription.metadata?.planId || "", // Debe venir en metadata
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      externalSubscriptionId: subscription.id,
    },
    update: {
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      externalSubscriptionId: subscription.id,
    },
  })

  console.log(`✅ Suscripción creada para clínica ${clinicId}`)
}

/**
 * Manejar actualización de suscripción
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const existingSubscription = await prisma.subscription.findFirst({
    where: { externalSubscriptionId: subscription.id },
  })

  if (!existingSubscription) {
    console.warn(`⚠️ Subscription ${subscription.id} no encontrada en DB`)
    return
  }

  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    },
  })

  console.log(`✅ Suscripción actualizada: ${subscription.id}`)
}

/**
 * Manejar eliminación de suscripción
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const existingSubscription = await prisma.subscription.findFirst({
    where: { externalSubscriptionId: subscription.id },
  })

  if (!existingSubscription) {
    console.warn(`⚠️ Subscription ${subscription.id} no encontrada en DB`)
    return
  }

  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: "canceled",
      canceledAt: new Date(),
    },
  })

  console.log(`✅ Suscripción cancelada: ${subscription.id}`)
}

/**
 * Manejar pago fallido de factura
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (typeof invoice.subscription !== "string") {
    return
  }

  const existingSubscription = await prisma.subscription.findFirst({
    where: { externalSubscriptionId: invoice.subscription },
  })

  if (!existingSubscription) {
    return
  }

  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: "past_due",
    },
  })

  console.log(`⚠️ Pago fallido para suscripción: ${invoice.subscription}`)
}

/**
 * Manejar factura pagada
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (typeof invoice.subscription !== "string") {
    return
  }

  const existingSubscription = await prisma.subscription.findFirst({
    where: { externalSubscriptionId: invoice.subscription },
  })

  if (!existingSubscription) {
    return
  }

  // Si estaba en past_due, reactivar
  if (existingSubscription.status === "past_due") {
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        status: "active",
      },
    })

    console.log(`✅ Suscripción reactivada: ${invoice.subscription}`)
  }
}

/**
 * Mapear estado de Stripe a estado interno
 */
function mapStripeStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trial",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
  }

  return statusMap[stripeStatus] || "active"
}
