"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SuccessToast } from "@/components/ui/success-toast"
import { Save, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAnalytics } from "@/lib/analytics"

interface QuickConsultationDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  turnoId: string
  pacienteNombre: string
  onSave?: () => void
}

export function QuickConsultationDrawer({
  open,
  onOpenChange,
  turnoId,
  pacienteNombre,
  onSave,
}: QuickConsultationDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    motivoConsulta: "",
    diagnostico: "",
    tratamiento: "",
    observaciones: "",
  })
  const router = useRouter()

  const { timeStart, timeEnd } = useAnalytics()

  const handleSave = async () => {
    timeStart("save_evolution")
    setLoading(true)
    try {
      // Aquí iría la llamada a la API para guardar la evolución
      const response = await fetch("/api/historia-clinica", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          turnoId,
          ...formData,
        }),
      })

      if (response.ok) {
        timeEnd("save_evolution", { success: true })
        // Mostrar éxito
        setShowSuccess(true)
        // Limpiar formulario
        setFormData({
          motivoConsulta: "",
          diagnostico: "",
          tratamiento: "",
          observaciones: "",
        })
        setTimeout(() => {
          onOpenChange(false)
          if (onSave) {
            onSave()
          }
          router.refresh()
        }, 500)
      } else {
        timeEnd("save_evolution", { success: false })
      }
    } catch (error) {
      console.error("Error al guardar evolución:", error)
      timeEnd("save_evolution", { success: false, error: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold text-[#0F172A] font-inter">
            Nueva Evolución Clínica
          </SheetTitle>
          <SheetDescription className="text-sm text-[#64748B]">
            Paciente: <span className="font-medium">{pacienteNombre}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Motivo de consulta */}
          <div className="space-y-2">
            <Label htmlFor="motivo" className="text-sm font-medium text-[#0F172A]">
              Motivo de consulta *
            </Label>
            <Textarea
              id="motivo"
              placeholder="Describa el motivo de la consulta..."
              value={formData.motivoConsulta}
              onChange={(e) =>
                setFormData({ ...formData, motivoConsulta: e.target.value })
              }
              className="min-h-[100px] rounded-xl border-[#E2E8F0] focus:ring-[#2563EB] resize-none"
            />
          </div>

          {/* Diagnóstico */}
          <div className="space-y-2">
            <Label htmlFor="diagnostico" className="text-sm font-medium text-[#0F172A]">
              Diagnóstico *
            </Label>
            <Textarea
              id="diagnostico"
              placeholder="Ingrese el diagnóstico..."
              value={formData.diagnostico}
              onChange={(e) =>
                setFormData({ ...formData, diagnostico: e.target.value })
              }
              className="min-h-[100px] rounded-xl border-[#E2E8F0] focus:ring-[#2563EB] resize-none"
            />
          </div>

          {/* Tratamiento */}
          <div className="space-y-2">
            <Label htmlFor="tratamiento" className="text-sm font-medium text-[#0F172A]">
              Tratamiento *
            </Label>
            <Textarea
              id="tratamiento"
              placeholder="Describa el tratamiento indicado..."
              value={formData.tratamiento}
              onChange={(e) =>
                setFormData({ ...formData, tratamiento: e.target.value })
              }
              className="min-h-[120px] rounded-xl border-[#E2E8F0] focus:ring-[#2563EB] resize-none"
            />
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones" className="text-sm font-medium text-[#0F172A]">
              Observaciones
            </Label>
            <Textarea
              id="observaciones"
              placeholder="Observaciones adicionales (opcional)..."
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              className="min-h-[80px] rounded-xl border-[#E2E8F0] focus:ring-[#2563EB] resize-none"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-8 flex gap-3 pt-6 border-t border-[#E2E8F0]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl border-[#E2E8F0] hover:bg-[#F8FAFC]"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.motivoConsulta || !formData.diagnostico || !formData.tratamiento}
            className="flex-1 bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium transition-all duration-200 ease-out"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Guardando..." : "Guardar Evolución"}
          </Button>
        </div>
      </SheetContent>
      <SuccessToast
        message="Evolución guardada correctamente"
        show={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </Sheet>
  )
}
