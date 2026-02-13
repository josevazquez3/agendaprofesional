"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { PatientAvatar } from "./patient-avatar"
import { FileText, Phone, Mail, Calendar, AlertTriangle, Heart } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface PatientQuickPreviewProps {
  paciente: {
    id: string
    nombre: string
    dni?: string | null
    telefono?: string | null
    email?: string | null
    fechaNacimiento?: Date | null
    alergias?: string | null
    enfermedadesCronicas?: string | null
  }
  ultimaConsulta?: Date | null
  children: React.ReactNode
  basePath?: string
}

export function PatientQuickPreview({
  paciente,
  ultimaConsulta,
  children,
  basePath = "/dashboard/admin",
}: PatientQuickPreviewProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const calcularEdad = (fechaNacimiento: Date | null) => {
    if (!fechaNacimiento) return null
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad
  }

  const edad = calcularEdad(paciente.fechaNacimiento || null)
  const tieneAlergias = paciente.alergias && paciente.alergias.trim() !== ""
  const tieneEnfermedadesCronicas =
    paciente.enfermedadesCronicas &&
    paciente.enfermedadesCronicas.trim() !== ""

  const handleOpenHistoria = () => {
    setOpen(false)
    router.push(`${basePath}/historia-clinica/${paciente.id}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 rounded-2xl border-[#E2E8F0] shadow-lg"
        align="start"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <PatientAvatar name={paciente.nombre} size="lg" />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-[#0F172A] font-inter truncate">
                {paciente.nombre}
              </h3>
              {paciente.dni && (
                <p className="text-sm text-[#64748B] mt-1">DNI: {paciente.dni}</p>
              )}
              {edad !== null && (
                <p className="text-sm text-[#64748B]">{edad} años</p>
              )}
            </div>
          </div>

          {/* Indicadores críticos */}
          {(tieneAlergias || tieneEnfermedadesCronicas) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tieneAlergias && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FEE2E2] text-[#991B1B] rounded-lg text-xs font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  Alergias
                </div>
              )}
              {tieneEnfermedadesCronicas && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FEF3C7] text-[#92400E] rounded-lg text-xs font-medium">
                  <Heart className="h-3 w-3" />
                  Crónicas
                </div>
              )}
            </div>
          )}

          {/* Información de contacto */}
          <div className="space-y-2 mb-4">
            {paciente.telefono && (
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <Phone className="h-4 w-4" />
                <span>{paciente.telefono}</span>
              </div>
            )}
            {paciente.email && (
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <Mail className="h-4 w-4" />
                <span className="truncate">{paciente.email}</span>
              </div>
            )}
            {ultimaConsulta && (
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <Calendar className="h-4 w-4" />
                <span>
                  Última consulta: {format(new Date(ultimaConsulta), "dd/MM/yyyy")}
                </span>
              </div>
            )}
          </div>

          {/* Acción principal */}
          <Button
            onClick={handleOpenHistoria}
            className="w-full bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium transition-all duration-200 ease-out"
          >
            <FileText className="h-4 w-4 mr-2" />
            Abrir Historia Clínica
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
