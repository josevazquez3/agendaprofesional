"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/dashboard/metric-card"
import { CheckCircle, Clock, XCircle } from "lucide-react"

interface DaySummaryPanelProps {
  turnosConfirmados: number
  turnosPendientes: number
  turnosCancelados: number
  /** ISO date string or Date (string evita problemas de serialización Server→Client) */
  fecha?: Date | string
}

export function DaySummaryPanel({
  turnosConfirmados,
  turnosPendientes,
  turnosCancelados,
  fecha,
}: DaySummaryPanelProps) {
  const totalTurnos = turnosConfirmados + turnosPendientes + turnosCancelados
  const fechaDate = fecha ? (typeof fecha === "string" ? new Date(fecha) : fecha) : new Date()

  return (
    <Card className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm">
      <CardHeader className="border-b border-[#E2E8F0]">
        <CardTitle className="text-lg font-semibold text-[#0F172A] font-inter">
          Resumen del día
        </CardTitle>
        <p className="text-sm text-[#64748B] mt-1">
          {fechaDate.toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#D1FAE5]/20 border border-[#A7F3D0]">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-[#065F46]" />
              <span className="text-sm font-medium text-[#0F172A]">
                Confirmados
              </span>
            </div>
            <span className="text-lg font-bold text-[#065F46]">
              {turnosConfirmados}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#DBEAFE]/30 border border-[#BFDBFE]">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-[#1D4ED8]" />
              <span className="text-sm font-medium text-[#1E293B]">
                Pendientes
              </span>
            </div>
            <span className="text-lg font-bold text-[#1D4ED8]">
              {turnosPendientes}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FEE2E2]/20 border border-[#FECACA]">
            <div className="flex items-center space-x-3">
              <XCircle className="h-5 w-5 text-[#991B1B]" />
              <span className="text-sm font-medium text-[#0F172A]">
                Cancelados
              </span>
            </div>
            <span className="text-lg font-bold text-[#991B1B]">
              {turnosCancelados}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#0F172A]">Total</span>
            <span className="text-xl font-bold text-[#0F172A]">
              {totalTurnos}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
