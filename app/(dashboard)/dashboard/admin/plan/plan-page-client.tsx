"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badge"
import { CreditCard, AlertCircle, Users, UserCheck, Calendar, HardDrive } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Progress } from "@/components/ui/progress"
import { PlanSelectorModal } from "@/components/billing/plan-selector-modal"
import { cn } from "@/lib/utils"
import type { ClinicSubscription } from "@/lib/subscription"
import type { PlanLimits, CurrentUsage } from "@/lib/plan-limits"

interface PlanPageClientProps {
  subscription: ClinicSubscription | null
  limits: PlanLimits | null
  usage: CurrentUsage
  clinicId: string
}

export function PlanPageClient({
  subscription,
  limits,
  usage,
  clinicId,
}: PlanPageClientProps) {
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (!subscription || !limits) {
    return null
  }

  const porcentajeUsuarios = limits.limiteUsuarios === -1 ? 0 : (usage.usuarios / limits.limiteUsuarios) * 100
  const porcentajeProfesionales = limits.limiteProfesionales === -1 ? 0 : (usage.profesionales / limits.limiteProfesionales) * 100
  const porcentajeTurnos = limits.limiteTurnosMes === -1 ? 0 : (usage.turnosMes / limits.limiteTurnosMes) * 100
  const porcentajeStorage = limits.storageLimitMb > 0 
    ? (usage.storageMb / limits.storageLimitMb) * 100 
    : 0

  const isNearLimit = (porcentaje: number) => porcentaje >= 80
  const isAtLimit = (porcentaje: number) => porcentaje >= 100

  const handleSelectPlan = async (planId: string) => {
    try {
      setLoading(true)
      const subscriptionId = subscription?.id
      if (!subscriptionId) {
        throw new Error("No se encontró suscripción")
      }

      const response = await fetch(`/api/platform/subscriptions/${subscriptionId}/change-plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al cambiar plan")
      }

      router.refresh()
    } catch (error) {
      console.error("Error cambiando plan:", error)
      alert(error instanceof Error ? error.message : "Error al cambiar plan")
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm("¿Estás seguro de que deseas cancelar tu suscripción?")) {
      return
    }

    try {
      setLoading(true)
      const subscriptionId = subscription?.id
      if (!subscriptionId) {
        throw new Error("No se encontró suscripción")
      }

      const response = await fetch(`/api/platform/subscriptions/${subscriptionId}/cancel`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al cancelar suscripción")
      }

      router.refresh()
    } catch (error) {
      console.error("Error cancelando suscripción:", error)
      alert(error instanceof Error ? error.message : "Error al cancelar suscripción")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Plan"
        subtitle="Gestión de suscripción y límites"
        action={
          <div className="flex gap-2">
            {subscription?.status === "active" && (
              <Button
                variant="outline"
                onClick={handleCancelSubscription}
                disabled={loading}
                className="rounded-xl border-[#EF4444] text-[#EF4444] hover:bg-[#FEE2E2]"
              >
                Cancelar Suscripción
              </Button>
            )}
            <Button
              onClick={() => setPlanModalOpen(true)}
              disabled={loading}
              className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {subscription ? "Cambiar Plan" : "Seleccionar Plan"}
            </Button>
          </div>
        }
      />

      {/* Plan Actual */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[#0F172A]">{subscription.plan.nombre}</h3>
              <p className="text-sm text-[#64748B] mt-1">
                ${subscription.plan.precioMensual}/mes
              </p>
            </div>
            <Badge
              variant={subscription.status === "active" ? "default" : "outline"}
            >
              {subscription.status === "active"
                ? "Activo"
                : subscription.status === "trial"
                ? "Trial"
                : subscription.status}
            </Badge>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#64748B]">Próximo ciclo de facturación</span>
              <span className="font-medium text-[#0F172A]">
                {format(subscription.currentPeriodEnd, "dd 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Límites y Consumo */}
      <Card>
        <CardHeader>
          <CardTitle>Consumo Actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usuarios */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#64748B]" />
                <span className="text-sm font-medium text-[#0F172A]">Usuarios</span>
              </div>
              <div className="flex items-center gap-2">
                {isAtLimit(porcentajeUsuarios) && (
                  <AlertCircle className="h-4 w-4 text-[#EF4444]" />
                )}
                {isNearLimit(porcentajeUsuarios) && !isAtLimit(porcentajeUsuarios) && (
                  <AlertCircle className="h-4 w-4 text-[#F59E0B]" />
                )}
                <span className="text-sm text-[#64748B]">
                  {usage.usuarios} / {limits.limiteUsuarios === -1 ? "∞" : limits.limiteUsuarios}
                </span>
              </div>
            </div>
            {limits.limiteUsuarios !== -1 ? (
              <>
                <Progress
                  value={Math.min(porcentajeUsuarios, 100)}
                  className={cn(
                    "h-2",
                    isAtLimit(porcentajeUsuarios) && "bg-[#FEE2E2]",
                    isNearLimit(porcentajeUsuarios) && !isAtLimit(porcentajeUsuarios) && "bg-[#FEF3C7]"
                  )}
                />
                {isAtLimit(porcentajeUsuarios) && (
                  <p className="text-xs text-[#EF4444] mt-1">
                    Has alcanzado el límite de usuarios.{" "}
                    <Button variant="link" className="p-0 h-auto text-xs text-[#2563EB]" onClick={() => setPlanModalOpen(true)}>
                      Actualizar plan
                    </Button>
                  </p>
                )}
                {isNearLimit(porcentajeUsuarios) && !isAtLimit(porcentajeUsuarios) && (
                  <p className="text-xs text-[#F59E0B] mt-1">
                    Estás cerca del límite de usuarios.
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-[#64748B] mt-1">Ilimitado</p>
            )}
          </div>

          {/* Profesionales */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#64748B]" />
                <span className="text-sm font-medium text-[#0F172A]">Profesionales</span>
              </div>
              <div className="flex items-center gap-2">
                {limits.limiteProfesionales !== -1 && isAtLimit(porcentajeProfesionales) && (
                  <AlertCircle className="h-4 w-4 text-[#EF4444]" />
                )}
                {limits.limiteProfesionales !== -1 && isNearLimit(porcentajeProfesionales) && !isAtLimit(porcentajeProfesionales) && (
                  <AlertCircle className="h-4 w-4 text-[#F59E0B]" />
                )}
                <span className="text-sm text-[#64748B]">
                  {usage.profesionales} / {limits.limiteProfesionales === -1 ? "∞" : limits.limiteProfesionales}
                </span>
              </div>
            </div>
            {limits.limiteProfesionales !== -1 ? (
              <>
                <Progress
                  value={Math.min(porcentajeProfesionales, 100)}
                  className={cn(
                    "h-2",
                    isAtLimit(porcentajeProfesionales) && "bg-[#FEE2E2]",
                    isNearLimit(porcentajeProfesionales) && !isAtLimit(porcentajeProfesionales) && "bg-[#FEF3C7]"
                  )}
                />
                {isAtLimit(porcentajeProfesionales) && (
                  <p className="text-xs text-[#EF4444] mt-1">
                    Has alcanzado el límite de profesionales.{" "}
                    <Button variant="link" className="p-0 h-auto text-xs text-[#2563EB]" onClick={() => setPlanModalOpen(true)}>
                      Actualizar plan
                    </Button>
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-[#64748B] mt-1">Ilimitado</p>
            )}
          </div>

          {/* Turnos del Mes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#64748B]" />
                <span className="text-sm font-medium text-[#0F172A]">Turnos del Mes</span>
              </div>
              <div className="flex items-center gap-2">
                {limits.limiteTurnosMes !== -1 && isAtLimit(porcentajeTurnos) && (
                  <AlertCircle className="h-4 w-4 text-[#EF4444]" />
                )}
                {limits.limiteTurnosMes !== -1 && isNearLimit(porcentajeTurnos) && !isAtLimit(porcentajeTurnos) && (
                  <AlertCircle className="h-4 w-4 text-[#F59E0B]" />
                )}
                <span className="text-sm text-[#64748B]">
                  {usage.turnosMes} / {limits.limiteTurnosMes === -1 ? "∞" : limits.limiteTurnosMes}
                </span>
              </div>
            </div>
            {limits.limiteTurnosMes !== -1 ? (
              <>
                <Progress
                  value={Math.min(porcentajeTurnos, 100)}
                  className={cn(
                    "h-2",
                    isAtLimit(porcentajeTurnos) && "bg-[#FEE2E2]",
                    isNearLimit(porcentajeTurnos) && !isAtLimit(porcentajeTurnos) && "bg-[#FEF3C7]"
                  )}
                />
                {isAtLimit(porcentajeTurnos) && (
                  <p className="text-xs text-[#EF4444] mt-1">
                    Has alcanzado el límite de turnos mensuales.{" "}
                    <Button variant="link" className="p-0 h-auto text-xs text-[#2563EB]" onClick={() => setPlanModalOpen(true)}>
                      Actualizar plan
                    </Button>
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-[#64748B] mt-1">Ilimitado</p>
            )}
          </div>

          {/* Storage */}
          {limits.storageLimitMb > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-[#64748B]" />
                  <span className="text-sm font-medium text-[#0F172A]">Almacenamiento</span>
                </div>
                <span className="text-sm text-[#64748B]">
                  {usage.storageMb} MB / {limits.storageLimitMb} MB
                </span>
              </div>
              <Progress value={Math.min(porcentajeStorage, 100)} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      <PlanSelectorModal
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        currentPlanId={subscription.planId}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  )
}
