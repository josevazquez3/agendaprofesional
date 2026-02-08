"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { typography, iconography } from "@/lib/typography"
import { cn } from "@/lib/utils"

interface OccupationIndicatorProps {
  ocupacionPorcentaje: number
  horasPico: string[]
  huecosDisponibles: number
  className?: string
}

export function OccupationIndicator({
  ocupacionPorcentaje,
  horasPico,
  huecosDisponibles,
  className,
}: OccupationIndicatorProps) {
  const getColor = (porcentaje: number) => {
    if (porcentaje >= 90) return "bg-[#EF4444]"
    if (porcentaje >= 70) return "bg-[#F59E0B]"
    if (porcentaje >= 50) return "bg-[#10B981]"
    return "bg-[#64748B]"
  }

  return (
    <Card className={cn("bg-white border border-[#E2E8F0] rounded-2xl shadow-sm", className)}>
      <CardHeader className="border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <Calendar className={cn(iconography.header, "text-[#2563EB]")} strokeWidth={iconography.strokeWidth} />
          <CardTitle className={typography.cardTitle}>Carga Operativa</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Barra de ocupación */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={typography.secondary}>Ocupación del día</span>
            <span className={cn(typography.body, "font-semibold")}>
              {ocupacionPorcentaje}%
            </span>
          </div>
          <div className="w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-500 ease-out", getColor(ocupacionPorcentaje))}
              style={{ width: `${Math.min(ocupacionPorcentaje, 100)}%` }}
            />
          </div>
        </div>

        {/* Horas pico */}
        {horasPico.length > 0 && (
          <div>
            <p className={cn(typography.secondary, "mb-2")}>Horas pico</p>
            <div className="flex flex-wrap gap-2">
              {horasPico.map((hora, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-[#FEF3C7] text-[#92400E] rounded-lg text-xs font-medium"
                >
                  {hora}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Huecos disponibles */}
        <div className="pt-3 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <span className={typography.secondary}>Huecos disponibles</span>
            <span className={cn(typography.body, "font-semibold text-[#10B981]")}>
              {huecosDisponibles}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
