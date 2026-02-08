"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
type Role = "PACIENTE" | "PROFESIONAL" | "SECRETARIA" | "ADMIN"
import { Home, Calendar, FileText, Settings, LogOut, Users, Heart, UserCircle } from "lucide-react"

interface NavbarProps {
  user: {
    id: string
    email: string
    name: string
    role: Role
  }
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()

  const getNavItems = () => {
    const baseItems = [
      { href: "/dashboard", label: "Inicio", icon: Home },
    ]

    switch (user.role) {
      case "PACIENTE":
        return [
          ...baseItems,
          { href: "/dashboard/paciente/turnos", label: "Mis Turnos", icon: Calendar },
          { href: "/dashboard/paciente/historia-clinica", label: "Historia Clínica", icon: FileText },
        ]
      case "PROFESIONAL":
        return [
          ...baseItems,
          { href: "/dashboard/profesional/turnos", label: "Turnos", icon: Calendar },
          { href: "/dashboard/profesional/historia-clinica", label: "Historia Clínica", icon: FileText },
          { href: "/dashboard/profesional/horarios", label: "Horarios", icon: Settings },
        ]
      case "SECRETARIA":
        return [
          ...baseItems,
          { href: "/dashboard/secretaria/turnos", label: "Turnos", icon: Calendar },
          { href: "/dashboard/secretaria/pacientes", label: "Pacientes", icon: Users },
          { href: "/dashboard/secretaria/historia-clinica", label: "Historia Clínica", icon: FileText },
          { href: "/dashboard/secretaria/horarios", label: "Horarios", icon: Settings },
          { href: "/dashboard/secretaria/consultorios", label: "Consultorios", icon: Settings },
          { href: "/dashboard/secretaria/obras-sociales", label: "Obras Sociales", icon: Heart },
        ]
      case "ADMIN":
        return [
          ...baseItems,
          { href: "/dashboard/admin/turnos", label: "Turnos", icon: Calendar },
          { href: "/dashboard/admin/usuarios", label: "Usuarios", icon: Users },
          { href: "/dashboard/admin/pacientes", label: "Pacientes", icon: UserCircle },
          { href: "/dashboard/admin/profesionales", label: "Profesionales", icon: Users },
          { href: "/dashboard/admin/horarios", label: "Horarios", icon: Settings },
          { href: "/dashboard/admin/consultorios", label: "Consultorios", icon: Settings },
          { href: "/dashboard/admin/obras-sociales", label: "Obras Sociales", icon: Heart },
          { href: "/dashboard/admin/historia-clinica", label: "Historia Clínica", icon: FileText },
        ]
      default:
        return baseItems
    }
  }

  const navItems = getNavItems()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              Agenda Profesional
            </Link>
            <div className="flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">{user.name}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {user.role}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
