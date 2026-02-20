"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock, Users, AlertCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { typography, iconography } from "@/lib/typography"
import { format } from "date-fns"

interface OperationalSummaryCardsProps {
  turnosProximos2Horas: number
  pacientesEnEspera: number
  turnosAtrasados: number
  cancelacionesDelDia: number
  className?: string
}

export function OperationalSummaryCards({
  turnosProximos2Horas,
  pacientesEnEspera,
  turnosAtrasados,
  cancelacionesDelDia,
  className,
}: OperationalSummaryCardsProps) {
  const cards = [
    {
      title: "Próximos 2 horas",
      value: turnosProximos2Horas,
      icon: Clock,
      color: "#2563EB",
      bgColor: "#EFF6FF",
    },
    {
      title: "En espera",
      value: pacientesEnEspera,
      icon: Users,
      color: "#0EA5A4",
      bgColor: "#E0F2F1",
    },
    {
      title: "Atrasados",
      value: turnosAtrasados,
      icon: AlertCircle,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
    },
    {
      title: "Cancelaciones hoy",
      value: cancelacionesDelDia,
      icon: XCircle,
      color: "#EF4444",
      bgColor: "#FEE2E2",
    },
  ]

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card
            key={index}
            className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ease-out"
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center justify-center text-center">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: card.bgColor }}
                >
                  <Icon
                    className={iconography.metric}
                    style={{ color: card.color }}
                    strokeWidth={iconography.strokeWidth}
                  />
                </div>
                <p className={cn(typography.secondary, "text-xs mb-1")}>
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-[#0F172A] font-inter">
                  {card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
