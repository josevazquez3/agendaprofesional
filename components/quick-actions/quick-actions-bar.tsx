"use client"

import { useRouter } from "next/navigation"
import {
  Calendar,
  UserPlus,
  FileText,
  Upload,
  Search,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { iconography, typography } from "@/lib/typography"

interface QuickAction {
  label: string
  icon: React.ReactNode
  onClick: () => void
  color?: string
}

interface QuickActionsBarProps {
  role: "SECRETARIA" | "PROFESIONAL" | "ADMIN"
  className?: string
}

export function QuickActionsBar({ role, className }: QuickActionsBarProps) {
  const router = useRouter()

  const getActions = (): QuickAction[] => {
    const baseActions: QuickAction[] = []

    if (role === "SECRETARIA" || role === "ADMIN") {
      baseActions.push(
        {
          label: "Nuevo turno",
          icon: <Calendar className={cn(iconography.text, "mr-2")} strokeWidth={iconography.strokeWidth} />,
          onClick: () => {
            if (role === "ADMIN") {
              router.push("/dashboard/admin/turnos/nuevo")
            } else {
              router.push("/dashboard/secretaria/turnos/nuevo")
            }
          },
          color: "#2563EB",
        },
        {
          label: "Nuevo paciente",
          icon: <UserPlus className={cn(iconography.text, "mr-2")} strokeWidth={iconography.strokeWidth} />,
          onClick: () => {
            if (role === "ADMIN") {
              router.push("/dashboard/admin/usuarios/nuevo")
            } else {
              router.push("/dashboard/secretaria/pacientes/nuevo")
            }
          },
          color: "#0EA5A4",
        }
      )
    }

    if (role === "PROFESIONAL" || role === "SECRETARIA" || role === "ADMIN") {
      baseActions.push(
        {
          label: "Nueva evolución",
          icon: <FileText className={cn(iconography.text, "mr-2")} strokeWidth={iconography.strokeWidth} />,
          onClick: () => {
            // Abrir modal de búsqueda de paciente para evolución
            router.push("/dashboard/historia-clinica/nueva")
          },
          color: "#7C3AED",
        },
        {
          label: "Cargar estudio",
          icon: <Upload className={cn(iconography.text, "mr-2")} strokeWidth={iconography.strokeWidth} />,
          onClick: () => {
            router.push("/dashboard/estudios/nuevo")
          },
          color: "#10B981",
        }
      )
    }

    baseActions.push({
      label: "Buscar paciente",
      icon: <Search className={cn(iconography.text, "mr-2")} strokeWidth={iconography.strokeWidth} />,
      onClick: () => {
        // Abrir command palette
        const event = new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          metaKey: true,
        })
        document.dispatchEvent(event)
      },
      color: "#F59E0B",
    })

    return baseActions
  }

  const actions = getActions()

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 p-4 bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm",
        className
      )}
    >
      <div className={cn("flex items-center gap-2 mr-2", typography.secondary, "font-medium")}>
        <Plus className={iconography.text} strokeWidth={iconography.strokeWidth} />
        Acciones rápidas:
      </div>
      {actions.map((action, index) => {
        return (
          <Button
            key={index}
            onClick={action.onClick}
            className={cn(
              "rounded-full px-4 py-2 h-auto font-medium transition-all duration-200 ease-out hover:scale-105",
              action.color
                ? `text-white hover:opacity-90`
                : "bg-[#F8FAFC] text-[#0F172A] hover:bg-[#E2E8F0]"
            )}
            style={
              action.color
                ? {
                    backgroundColor: action.color,
                  }
                : undefined
            }
          >
            {action.icon}
            {action.label}
          </Button>
        )
      })}
    </div>
  )
}
