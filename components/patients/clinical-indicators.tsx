"use client"

import { AlertTriangle, Heart, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClinicalIndicatorsProps {
  alergias?: string | null
  enfermedadesCronicas?: string | null
  tieneEstudiosRecientes?: boolean
  className?: string
}

export function ClinicalIndicators({
  alergias,
  enfermedadesCronicas,
  tieneEstudiosRecientes,
  className,
}: ClinicalIndicatorsProps) {
  const tieneAlergias = alergias && alergias.trim() !== ""
  const tieneCronicas =
    enfermedadesCronicas && enfermedadesCronicas.trim() !== ""

  if (!tieneAlergias && !tieneCronicas && !tieneEstudiosRecientes) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {tieneAlergias && (
        <div
          className="flex items-center gap-1 px-2 py-0.5 bg-[#FEE2E2] text-[#991B1B] rounded-lg text-xs font-medium"
          title="Paciente con alergias"
        >
          <AlertTriangle className="h-3 w-3" />
          <span className="hidden sm:inline">Alergias</span>
        </div>
      )}
      {tieneCronicas && (
        <div
          className="flex items-center gap-1 px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] rounded-lg text-xs font-medium"
          title="Paciente con enfermedades crónicas"
        >
          <Heart className="h-3 w-3" />
          <span className="hidden sm:inline">Crónicas</span>
        </div>
      )}
      {tieneEstudiosRecientes && (
        <div
          className="flex items-center gap-1 px-2 py-0.5 bg-[#DBEAFE] text-[#1E40AF] rounded-lg text-xs font-medium"
          title="Estudios recientes disponibles"
        >
          <FileText className="h-3 w-3" />
          <span className="hidden sm:inline">Estudios</span>
        </div>
      )}
    </div>
  )
}
