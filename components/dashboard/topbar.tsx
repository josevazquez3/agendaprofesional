"use client"

import { Bell, User, Search } from "lucide-react"
import { signOut } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TopbarProps {
  userName: string
  userEmail: string
  userRole: string
  sidebarCollapsed?: boolean
}

export function Topbar({
  userName,
  userEmail,
  userRole,
  sidebarCollapsed = false,
}: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Implementar búsqueda global según el rol
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header
      className={cn(
        "fixed top-0 h-[72px] bg-white border-b border-[#E2E8F0] z-30 transition-all duration-300 ease-out",
        sidebarCollapsed ? "left-[72px]" : "left-[260px]",
        "right-0"
      )}
    >
      <div className="h-full flex items-center justify-between px-6">
        {/* Buscador Global */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#64748B]" />
            <Input
              type="text"
              placeholder="Buscar pacientes, turnos, historias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-[#E2E8F0] focus:ring-[#2563EB] transition-all duration-200 ease-out bg-[#F8FAFC] focus:bg-white"
            />
          </div>
        </form>

        {/* Acciones derecha */}
        <div className="flex items-center space-x-4">
          {/* Notificaciones */}
          <button
            className="relative p-2 text-[#64748B] hover:text-[#0F172A] transition-colors duration-200 ease-out rounded-lg hover:bg-[#F8FAFC]"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" strokeWidth={1.5} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#2563EB] rounded-full"></span>
          </button>

          {/* Usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-[#F8FAFC] transition-all duration-200 ease-out">
                <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                  <User className="h-4 w-4 text-[#2563EB]" strokeWidth={1.5} />
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-[#0F172A]">
                    {userName}
                  </div>
                  <div className="text-xs text-[#64748B]">{userRole}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-[#64748B]">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // Navegar según el rol del usuario
                  if (userRole === "PROFESIONAL") {
                    router.push("/dashboard/profesional/perfil")
                  } else if (userRole === "SECRETARIA") {
                    router.push("/dashboard/secretaria/perfil")
                  } else if (userRole === "ADMIN") {
                    router.push("/dashboard/admin/perfil")
                  } else if (userRole === "PACIENTE") {
                    router.push("/dashboard/paciente/perfil")
                  }
                }}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // Navegar según el rol del usuario
                  if (userRole === "PROFESIONAL") {
                    router.push("/dashboard/profesional/configuracion")
                  } else if (userRole === "SECRETARIA") {
                    router.push("/dashboard/secretaria/configuracion")
                  } else if (userRole === "ADMIN") {
                    router.push("/dashboard/admin/configuracion")
                  }
                }}
              >
                <Bell className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-600"
              >
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
