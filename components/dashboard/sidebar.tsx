"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCircle,
  Stethoscope,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
  BarChart3,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { iconography } from "@/lib/typography"

type Role = "PACIENTE" | "PROFESIONAL" | "SECRETARIA" | "ADMIN" | "OWNER" | "PLATFORM_OWNER"

interface SidebarProps {
  userRole: Role
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({
  userRole,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname()

  const getMenuItems = () => {
    const baseItems = [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ]

    switch (userRole) {
      case "OWNER":
      case "PLATFORM_OWNER":
      case "ADMIN":
        return [
          ...baseItems,
          { href: "/dashboard/admin/turnos", label: "Turnos", icon: Calendar },
          { href: "/dashboard/admin/pacientes", label: "Pacientes", icon: Users },
          {
            href: "/dashboard/admin/historia-clinica",
            label: "Historia Clínica",
            icon: FileText,
          },
          {
            href: "/dashboard/admin/profesionales",
            label: "Profesionales",
            icon: UserCircle,
          },
          {
            href: "/dashboard/admin/consultorios",
            label: "Consultorios",
            icon: Building2,
          },
          {
            href: "/dashboard/admin/reportes",
            label: "Reportes",
            icon: BarChart3,
          },
          {
            href: "/dashboard/admin/obras-sociales",
            label: "Obras Sociales",
            icon: Stethoscope,
          },
          {
            href: "/dashboard/admin/configuracion",
            label: "Configuración",
            icon: Settings,
          },
        ]
      case "SECRETARIA":
        return [
          ...baseItems,
          { href: "/dashboard/secretaria/turnos", label: "Turnos", icon: Calendar },
          {
            href: "/dashboard/secretaria/pacientes",
            label: "Pacientes",
            icon: Users,
          },
          {
            href: "/dashboard/secretaria/historia-clinica",
            label: "Historia Clínica",
            icon: FileText,
          },
          {
            href: "/dashboard/secretaria/profesionales",
            label: "Profesionales",
            icon: UserCircle,
          },
          {
            href: "/dashboard/secretaria/consultorios",
            label: "Consultorios",
            icon: Building2,
          },
          {
            href: "/dashboard/secretaria/reportes",
            label: "Reportes",
            icon: BarChart3,
          },
          {
            href: "/dashboard/secretaria/obras-sociales",
            label: "Obras Sociales",
            icon: Stethoscope,
          },
          {
            href: "/dashboard/secretaria/configuracion",
            label: "Configuración",
            icon: Settings,
          },
        ]
      case "PROFESIONAL":
        return [
          ...baseItems,
          {
            href: "/dashboard/profesional/turnos",
            label: "Turnos",
            icon: Calendar,
          },
          {
            href: "/dashboard/profesional/historia-clinica",
            label: "Historia Clínica",
            icon: FileText,
          },
          {
            href: "/dashboard/profesional/pacientes",
            label: "Pacientes",
            icon: Users,
          },
          {
            href: "/dashboard/profesional/configuracion",
            label: "Configuración",
            icon: Settings,
          },
        ]
      case "PACIENTE":
        return [
          ...baseItems,
          {
            href: "/dashboard/paciente/turnos",
            label: "Turnos",
            icon: Calendar,
          },
          {
            href: "/dashboard/paciente/historia-clinica",
            label: "Historia Clínica",
            icon: FileText,
          },
        ]
      default:
        return baseItems
    }
  }

  const menuItems = getMenuItems()

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          "h-full bg-[#0F172A] transition-all duration-300 ease-out flex flex-col",
          collapsed ? "w-[72px]" : "w-[280px]"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className={cn(
              "h-[72px] flex items-center border-b border-[#334155] transition-all duration-300 ease-out",
              collapsed ? "px-4 justify-center" : "px-6 justify-between"
            )}
          >
            {!collapsed && (
              <Link href="/dashboard" className="flex items-center min-w-0 flex-1 mr-2">
                <span className="text-base font-semibold text-white font-inter leading-tight">
                  Agenda Profesional
                </span>
              </Link>
            )}
            {collapsed && (
              <Link href="/dashboard" className="flex items-center">
                <span className="text-xl font-semibold text-white font-inter">
                  AP
                </span>
              </Link>
            )}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg hover:bg-[#1E293B] transition-all duration-200 ease-out text-[#94A3B8] hover:text-white"
                aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {/* Menú */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto overflow-x-hidden">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/")

                const menuItem = (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-xl text-sm font-medium transition-all duration-200 ease-out",
                      collapsed ? "justify-center px-3 py-2.5" : "space-x-3 px-3 py-2.5",
                      isActive
                        ? "bg-[#2563EB] text-white"
                        : "text-[#94A3B8] hover:bg-[#1E293B] hover:text-white"
                    )}
                  >
                    <Icon className={cn(iconography.header, "flex-shrink-0")} strokeWidth={iconography.strokeWidth} />
                    {!collapsed && (
                      <span className="whitespace-nowrap">{item.label}</span>
                    )}
                  </Link>
                )

                if (collapsed) {
                  return (
                    <li key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>{menuItem}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    </li>
                  )
                }

                return <li key={item.href}>{menuItem}</li>
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </TooltipProvider>
  )
}
