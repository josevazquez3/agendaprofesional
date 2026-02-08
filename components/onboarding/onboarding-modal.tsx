"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UserCircle, Stethoscope, Calendar, Check, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { iconography, typography } from "@/lib/typography"
import { useRouter } from "next/navigation"

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  action: {
    label: string
    href: string
  }
}

interface OnboardingModalProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
  userRole: "ADMIN" | "SECRETARIA" | "PROFESIONAL"
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: "Configurar profesionales",
    description: "Agregue los profesionales médicos que trabajarán en su clínica",
    icon: <UserCircle className={cn(iconography.large, "text-[#2563EB]")} strokeWidth={iconography.strokeWidth} />,
    action: {
      label: "Ir a Profesionales",
      href: "/dashboard/admin/profesionales",
    },
  },
  {
    id: 2,
    title: "Configurar especialidades",
    description: "Defina las especialidades médicas disponibles",
    icon: <Stethoscope className={cn(iconography.large, "text-[#2563EB]")} strokeWidth={iconography.strokeWidth} />,
    action: {
      label: "Ir a Especialidades",
      href: "/dashboard/admin/obras-sociales",
    },
  },
  {
    id: 3,
    title: "Crear primer turno",
    description: "Agende su primer turno médico para comenzar",
    icon: <Calendar className={cn(iconography.large, "text-[#2563EB]")} strokeWidth={iconography.strokeWidth} />,
    action: {
      label: "Crear turno",
      href: "/dashboard/admin/turnos/nuevo",
    },
  },
]

export function OnboardingModal({
  open,
  onClose,
  onComplete,
  userRole,
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const router = useRouter()

  const handleStepComplete = (stepId: number) => {
    setCompletedSteps([...completedSteps, stepId])
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    onComplete()
    onClose()
  }

  const handleAction = (step: OnboardingStep) => {
    router.push(step.action.href)
    handleStepComplete(step.id)
  }

  const currentStepData = steps[currentStep]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl border-[#E2E8F0]">
        <DialogHeader>
          <DialogTitle className={cn(typography.pageTitle, "text-center")}>
            Bienvenido a Agenda Profesional
          </DialogTitle>
          <DialogDescription className={cn(typography.subtitle, "text-center mt-2")}>
            Configure su sistema en 3 pasos rápidos
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mt-6 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200",
                  completedSteps.includes(step.id)
                    ? "bg-[#10B981] border-[#10B981] text-white"
                    : index === currentStep
                    ? "bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]"
                    : "bg-white border-[#E2E8F0] text-[#64748B]"
                )}
              >
                {completedSteps.includes(step.id) ? (
                  <Check className={iconography.text} strokeWidth={iconography.strokeWidth} />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-12 h-0.5 transition-all duration-200",
                    completedSteps.includes(step.id)
                      ? "bg-[#10B981]"
                      : "bg-[#E2E8F0]"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Current step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="text-center py-6"
          >
            {currentStepData?.icon && (
              <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-6">
                {currentStepData.icon}
              </div>
            )}
            <h3 className={cn(typography.sectionTitle, "mb-3")}>
              {currentStepData.title}
            </h3>
            <p className={cn(typography.secondary, "max-w-md mx-auto mb-8")}>
              {currentStepData.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 pt-6 border-t border-[#E2E8F0]">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="rounded-xl text-[#64748B] hover:text-[#0F172A]"
          >
            Hacerlo luego
          </Button>
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="rounded-xl border-[#E2E8F0]"
              >
                Anterior
              </Button>
            )}
            <Button
              onClick={() => handleAction(currentStepData)}
              className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium"
            >
              {currentStepData.action.label}
              <ArrowRight className={cn(iconography.text, "ml-2")} strokeWidth={iconography.strokeWidth} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
