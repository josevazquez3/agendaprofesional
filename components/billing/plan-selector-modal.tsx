"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { typography, iconography } from "@/lib/typography"

interface Plan {
  id: string
  nombre: string
  precioMensual: number
  limiteUsuarios: number
  limiteProfesionales: number
  limiteTurnosMes: number
  storageLimitMb: number
}

interface PlanSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlanId?: string
  onSelectPlan: (planId: string) => Promise<void>
}

export function PlanSelectorModal({
  open,
  onOpenChange,
  currentPlanId,
  onSelectPlan,
}: PlanSelectorModalProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (open) {
      fetchPlans()
    }
  }, [open])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/platform/plans")
      const data = await response.json()
      setPlans(data.plans || [])
    } catch (error) {
      console.error("Error obteniendo planes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async () => {
    if (!selectedPlanId) return

    try {
      setProcessing(true)
      await onSelectPlan(selectedPlanId)
      onOpenChange(false)
    } catch (error) {
      console.error("Error seleccionando plan:", error)
    } finally {
      setProcessing(false)
    }
  }

  const formatLimit = (limit: number) => {
    if (limit === -1) return "Ilimitado"
    return limit.toLocaleString()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className={cn(typography.pageTitle)}>
            Seleccionar Plan
          </DialogTitle>
          <DialogDescription className={cn(typography.subtitle)}>
            Elige el plan que mejor se adapte a las necesidades de tu clínica
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className={cn(iconography.large, "animate-spin text-[#2563EB]")} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {plans.map((plan) => {
              const isCurrentPlan = plan.id === currentPlanId
              const isSelected = selectedPlanId === plan.id

              return (
                <div
                  key={plan.id}
                  onClick={() => !isCurrentPlan && setSelectedPlanId(plan.id)}
                  className={cn(
                    "relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                    isCurrentPlan
                      ? "border-[#2563EB] bg-[#EFF6FF]"
                      : isSelected
                      ? "border-[#2563EB] bg-white shadow-md"
                      : "border-[#E2E8F0] bg-white hover:border-[#2563EB] hover:shadow-sm"
                  )}
                >
                  {isCurrentPlan && (
                    <Badge className="absolute top-4 right-4">Plan Actual</Badge>
                  )}
                  {isSelected && !isCurrentPlan && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className={cn(typography.sectionTitle, "mb-2")}>
                      {plan.nombre}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-[#0F172A]">
                        ${plan.precioMensual}
                      </span>
                      <span className="text-sm text-[#64748B]">/mes</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Usuarios</span>
                      <span className="font-medium text-[#0F172A]">
                        {formatLimit(plan.limiteUsuarios)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Profesionales</span>
                      <span className="font-medium text-[#0F172A]">
                        {formatLimit(plan.limiteProfesionales)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Turnos/mes</span>
                      <span className="font-medium text-[#0F172A]">
                        {formatLimit(plan.limiteTurnosMes)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">Almacenamiento</span>
                      <span className="font-medium text-[#0F172A]">
                        {formatLimit(plan.storageLimitMb)} MB
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[#E2E8F0]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSelectPlan}
            disabled={!selectedPlanId || processing || selectedPlanId === currentPlanId}
            className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              "Cambiar Plan"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
