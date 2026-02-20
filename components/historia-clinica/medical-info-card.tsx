"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Heart, Pill, FileText } from "lucide-react"

interface MedicalInfoCardProps {
  alergias?: string | null
  enfermedadesCronicas?: string | null
  medicacionActual?: string | null
  observaciones?: string | null
}

export function MedicalInfoCard({
  alergias,
  enfermedadesCronicas,
  medicacionActual,
  observaciones,
}: MedicalInfoCardProps) {
  return (
    <Card className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm mt-6">
      <CardHeader className="border-b border-[#E2E8F0]">
        <CardTitle className="text-lg font-semibold text-[#0F172A] font-inter">
          Información Médica
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div>
          <div className="flex items-start space-x-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-[#F59E0B] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-1">
                Alergias
              </h3>
              <p className="text-sm text-[#64748B]">
                {alergias || "No registradas"}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-start space-x-3 mb-2">
            <Heart className="h-5 w-5 text-[#EF4444] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-1">
                Enfermedades Crónicas
              </h3>
              <p className="text-sm text-[#64748B]">
                {enfermedadesCronicas || "No registradas"}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-start space-x-3 mb-2">
            <Pill className="h-5 w-5 text-[#2563EB] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-1">
                Medicación Actual
              </h3>
              <p className="text-sm text-[#64748B]">
                {medicacionActual || "No registrada"}
              </p>
            </div>
          </div>
        </div>

        {observaciones && (
          <div>
            <div className="flex items-start space-x-3 mb-2">
              <FileText className="h-5 w-5 text-[#64748B] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-1">
                  Observaciones
                </h3>
                <p className="text-sm text-[#64748B] whitespace-pre-wrap">
                  {observaciones}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
