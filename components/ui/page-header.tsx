"use client"

import { ReactNode } from "react"
import { Breadcrumb } from "./breadcrumb"
import { typography, spacing } from "@/lib/typography"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumb?: BreadcrumbItem[]
  action?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",
        className
      )}
    >
      <div className="flex-1">
        {breadcrumb && breadcrumb.length > 0 && (
          <Breadcrumb items={breadcrumb} className="mb-4" />
        )}
        <h1 className={cn(typography.pageTitle, "lg:text-3xl")}>{title}</h1>
        {subtitle && <p className={cn(typography.subtitle, "mt-1")}>{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
