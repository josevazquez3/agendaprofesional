"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)}>
      <Link
        href="/dashboard"
        className="text-[#64748B] hover:text-[#2563EB] transition-colors duration-200 ease-out"
      >
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-[#64748B]" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-[#64748B] hover:text-[#2563EB] transition-colors duration-200 ease-out"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[#0F172A] font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
