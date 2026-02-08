"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, Calendar, Users, FileText, UserPlus, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { iconography, typography } from "@/lib/typography"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  keywords?: string[]
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [userRole, setUserRole] = useState<string>("PACIENTE")
  const router = useRouter()

  useEffect(() => {
    // Obtener el rol del usuario desde la sesión
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.role) {
          setUserRole(data.user.role)
        }
      })
      .catch(() => {})
  }, [])

  const getCommands = (): CommandItem[] => {
    const role = userRole
    const commands: CommandItem[] = []

    // Navegación rápida
    commands.push(
      {
        id: "dashboard",
        label: "Ir al Dashboard",
        description: "Panel principal",
        icon: <Calendar className={cn(iconography.header, "flex-shrink-0")} strokeWidth={iconography.strokeWidth} />,
        action: () => router.push("/dashboard"),
        keywords: ["dashboard", "inicio", "principal"],
      },
      {
        id: "turnos",
        label: "Ver Turnos",
        description: "Gestión de turnos",
        icon: <Calendar className={cn(iconography.header, "flex-shrink-0")} strokeWidth={iconography.strokeWidth} />,
        action: () => {
          if (role === "ADMIN") {
            router.push("/dashboard/admin/turnos")
          } else if (role === "SECRETARIA") {
            router.push("/dashboard/secretaria/turnos")
          } else if (role === "PROFESIONAL") {
            router.push("/dashboard/profesional/turnos")
          } else {
            router.push("/dashboard/paciente/turnos")
          }
        },
        keywords: ["turnos", "citas", "appointments"],
      },
      {
        id: "pacientes",
        label: "Ver Pacientes",
        description: "Lista de pacientes",
        icon: <Users className={cn(iconography.header, "flex-shrink-0")} strokeWidth={iconography.strokeWidth} />,
        action: () => {
          if (role === "ADMIN") {
            router.push("/dashboard/admin/pacientes")
          } else if (role === "SECRETARIA") {
            router.push("/dashboard/secretaria/pacientes")
          }
        },
        keywords: ["pacientes", "patients"],
      },
      {
        id: "historia-clinica",
        label: "Historia Clínica",
        description: "Acceder a historias clínicas",
        icon: <FileText className={cn(iconography.header, "flex-shrink-0")} strokeWidth={iconography.strokeWidth} />,
        action: () => {
          if (role === "ADMIN") {
            router.push("/dashboard/admin/historia-clinica")
          } else if (role === "SECRETARIA") {
            router.push("/dashboard/secretaria/historia-clinica")
          } else if (role === "PROFESIONAL") {
            router.push("/dashboard/profesional/historia-clinica")
          }
        },
        keywords: ["historia", "clinica", "medical", "records"],
      }
    )

    // Acciones rápidas
    if (role === "ADMIN" || role === "SECRETARIA") {
      commands.push(
        {
          id: "nuevo-turno",
          label: "Crear nuevo turno",
          description: "Agendar cita nueva",
          icon: <Calendar className={cn(iconography.header, "flex-shrink-0")} strokeWidth={iconography.strokeWidth} />,
          action: () => {
            if (role === "ADMIN") {
              router.push("/dashboard/admin/turnos/nuevo")
            } else {
              router.push("/dashboard/secretaria/turnos/nuevo")
            }
            onOpenChange(false)
          },
          keywords: ["nuevo", "crear", "agendar", "turno"],
        },
        {
          id: "nuevo-paciente",
          label: "Registrar nuevo paciente",
          description: "Agregar paciente al sistema",
          icon: <UserPlus className={cn(iconography.header, "flex-shrink-0")} strokeWidth={iconography.strokeWidth} />,
          action: () => {
            if (role === "ADMIN") {
              router.push("/dashboard/admin/usuarios/nuevo")
            } else {
              router.push("/dashboard/secretaria/pacientes/nuevo")
            }
            onOpenChange(false)
          },
          keywords: ["nuevo", "paciente", "registrar", "agregar"],
        }
      )
    }

    return commands
  }

  const commands = getCommands()

  const filteredCommands = commands.filter((cmd) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      cmd.label.toLowerCase().includes(query) ||
      cmd.description?.toLowerCase().includes(query) ||
      cmd.keywords?.some((kw) => kw.toLowerCase().includes(query))
    )
  })

  const handleSelect = (command: CommandItem) => {
    command.action()
    setSearchQuery("")
    setSelectedIndex(0)
    onOpenChange(false)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
      } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
        e.preventDefault()
        handleSelect(filteredCommands[selectedIndex])
      }
    }

    if (open) {
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, selectedIndex, filteredCommands])

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 rounded-2xl border-[#E2E8F0] shadow-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#E2E8F0]">
          <DialogTitle className="text-lg font-semibold text-[#0F172A] font-inter">
            Búsqueda rápida
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#64748B]" />
            <Input
              type="text"
              placeholder="Buscar pacientes, turnos, acciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-[#E2E8F0] focus:ring-[#2563EB]"
              autoFocus
            />
          </div>
        </div>
        <div className="px-6 pb-6 max-h-[400px] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#64748B]">
              No se encontraron resultados
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((command, index) => {
                return (
                  <button
                    key={command.id}
                    onClick={() => handleSelect(command)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ease-out",
                      index === selectedIndex
                        ? "bg-[#EFF6FF] text-[#2563EB]"
                        : "hover:bg-[#F8FAFC] text-[#0F172A]"
                    )}
                  >
                    {command.icon}
                    <div className="flex-1 min-w-0">
                      <div className={typography.body}>{command.label}</div>
                      {command.description && (
                        <div className={cn(typography.secondary, "mt-0.5")}>
                          {command.description}
                        </div>
                      )}
                    </div>
                    <ArrowRight className={cn(iconography.text, "text-[#64748B]")} strokeWidth={iconography.strokeWidth} />
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] rounded-b-2xl">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-[#E2E8F0] rounded text-xs">
                  ↑↓
                </kbd>
                <span>Navegar</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-[#E2E8F0] rounded text-xs">
                  Enter
                </kbd>
                <span>Seleccionar</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white border border-[#E2E8F0] rounded text-xs">
                Esc
              </kbd>
              <span>Cerrar</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
