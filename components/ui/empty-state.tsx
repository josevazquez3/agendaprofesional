"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { Button } from "./button"
import { cn } from "@/lib/utils"
import { typography } from "@/lib/typography"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
    variant?: "default" | "outline"
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const ActionButton = action?.href ? (
    <Link href={action.href}>
      <Button
        variant={action.variant || "default"}
        className="rounded-xl font-medium transition-all duration-200 ease-out"
      >
        {action.label}
      </Button>
    </Link>
  ) : action?.onClick ? (
    <Button
      variant={action.variant || "default"}
      onClick={action.onClick}
      className="rounded-xl font-medium transition-all duration-200 ease-out"
    >
      {action.label}
    </Button>
  ) : null

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mb-6">
          {icon}
        </div>
      )}
      <h3 className={cn(typography.sectionTitle, "mb-3")}>{title}</h3>
      {description && (
        <p className={cn(typography.secondary, "max-w-md mb-6 leading-relaxed")}>
          {description}
        </p>
      )}
      {ActionButton}
    </div>
  )
}
