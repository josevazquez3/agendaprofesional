"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, Calendar } from "lucide-react"

interface PatientSummaryPanelProps {
  totalPacientes: number
  nuevosEsteMes: number
  pacientesFrecuentes: number
}

export function PatientSummaryPanel({
  totalPacientes,
  nuevosEsteMes,
  pacientesFrecuentes,
}: PatientSummaryPanelProps) {
  return (
    <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
      <CardHeader className="border-b border-[#E2E8F0]">
        <CardTitle className="text-lg font-semibold text-[#0F172A] font-inter">
          Resumen
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#EFF6FF]/20 border border-[#BFDBFE]">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-[#2563EB]" />
              <span className="text-sm font-medium text-[#0F172A]">
                Pacientes activos
              </span>
            </div>
            <span className="text-lg font-bold text-[#2563EB]">
              {totalPacientes}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#D1FAE5]/20 border border-[#A7F3D0]">
            <div className="flex items-center space-x-3">
              <UserPlus className="h-5 w-5 text-[#065F46]" />
              <span className="text-sm font-medium text-[#0F172A]">
                Nuevos este mes
              </span>
            </div>
            <span className="text-lg font-bold text-[#065F46]">
              {nuevosEsteMes}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FEF3C7]/20 border border-[#FDE68A]">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-[#92400E]" />
              <span className="text-sm font-medium text-[#0F172A]">
                Pacientes frecuentes
              </span>
            </div>
            <span className="text-lg font-bold text-[#92400E]">
              {pacientesFrecuentes}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
