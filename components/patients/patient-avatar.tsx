"use client"

import { cn } from "@/lib/utils"

interface PatientAvatarProps {
  name: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PatientAvatar({
  name,
  size = "md",
  className,
}: PatientAvatarProps) {
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ")
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase()
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  }

  const initials = getInitials(name)

  // Generar color basado en el nombre para consistencia
  const colors = [
    "bg-[#2563EB]",
    "bg-[#0EA5A4]",
    "bg-[#7C3AED]",
    "bg-[#F59E0B]",
    "bg-[#EF4444]",
    "bg-[#10B981]",
  ]
  const colorIndex =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length
  const bgColor = colors[colorIndex]

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white",
        sizeClasses[size],
        bgColor,
        className
      )}
    >
      {initials}
    </div>
  )
}
