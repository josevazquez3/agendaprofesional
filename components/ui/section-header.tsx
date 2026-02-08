"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { typography } from "@/lib/typography"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6",
        className
      )}
    >
      <div className="flex-1">
        <h2 className={cn(typography.sectionTitle, "lg:text-xl")}>{title}</h2>
        {subtitle && <p className={cn(typography.subtitle, "mt-1")}>{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
