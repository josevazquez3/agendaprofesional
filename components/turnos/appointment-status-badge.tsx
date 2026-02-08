"use client"

import { cn } from "@/lib/utils"

interface AppointmentStatusBadgeProps {
  status: string
  className?: string
}

export function AppointmentStatusBadge({
  status,
  className,
}: AppointmentStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "CONFIRMADO":
        return {
          label: "Confirmado",
          className: "bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]",
        }
      case "PENDIENTE":
        return {
          label: "Pendiente",
          className: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
        }
      case "CANCELADO":
        return {
          label: "Cancelado",
          className: "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]",
        }
      case "COMPLETADO":
        return {
          label: "Completado",
          className: "bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]",
        }
      case "ELIMINADO":
        return {
          label: "Eliminado",
          className: "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]",
        }
      default:
        return {
          label: status,
          className: "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]",
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
