"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
// Select removed - using native HTML select
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"

interface AppointmentFiltersProps {
  profesionales: Array<{
    id: string
    user: {
      nombre: string
    }
    especialidad: string
  }>
  especialidades?: string[]
}

export function AppointmentFilters({
  profesionales,
  especialidades = [],
}: AppointmentFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [profesionalId, setProfesionalId] = useState(
    searchParams.get("profesionalId") || ""
  )
  const [especialidad, setEspecialidad] = useState(
    searchParams.get("especialidad") || ""
  )
  const [fecha, setFecha] = useState(searchParams.get("fecha") || "")
  const [estado, setEstado] = useState(searchParams.get("estado") || "")

  useEffect(() => {
    setSearch(searchParams.get("search") || "")
    setProfesionalId(searchParams.get("profesionalId") || "")
    setEspecialidad(searchParams.get("especialidad") || "")
    setFecha(searchParams.get("fecha") || "")
    setEstado(searchParams.get("estado") || "")
  }, [searchParams])

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (profesionalId) params.set("profesionalId", profesionalId)
    if (especialidad) params.set("especialidad", especialidad)
    if (fecha) params.set("fecha", fecha)
    if (estado) params.set("estado", estado)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleClear = () => {
    setSearch("")
    setProfesionalId("")
    setEspecialidad("")
    setFecha("")
    setEstado("")
    router.push(pathname)
  }

  const hasFilters =
    search || profesionalId || especialidad || fecha || estado

  // Obtener especialidades únicas de los profesionales
  const especialidadesUnicas = [
    ...new Set(profesionales.map((p) => p.especialidad)),
  ]

  return (
    <div className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm p-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Buscador */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#64748B]" />
          <Input
            type="text"
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-[#E2E8F0] focus:ring-[#2563EB]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleFilter()
              }
            }}
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 flex-1">
          <select
            value={profesionalId}
            onChange={(e) => setProfesionalId(e.target.value)}
            className="min-w-[180px] rounded-xl border-[#E2E8F0] focus:ring-[#2563EB] px-3 py-2"
          >
            <option value="">Todos los profesionales</option>
            {profesionales.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.user.nombre}
              </option>
            ))}
          </select>

          <select
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            className="min-w-[160px] rounded-xl border-[#E2E8F0] focus:ring-[#2563EB] px-3 py-2"
          >
            <option value="">Todas las especialidades</option>
            {especialidadesUnicas.map((esp) => (
              <option key={esp} value={esp}>
                {esp}
              </option>
            ))}
          </select>

          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="min-w-[160px] rounded-xl border-[#E2E8F0] focus:ring-[#2563EB]"
          />

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="min-w-[140px] rounded-xl border-[#E2E8F0] focus:ring-[#2563EB] px-3 py-2"
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="CONFIRMADO">Confirmado</option>
            <option value="CANCELADO">Cancelado</option>
            <option value="COMPLETADO">Completado</option>
          </select>
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <Button
            onClick={handleFilter}
            className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium px-6 transition-all duration-200 ease-out hover:scale-[1.02]"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
          {hasFilters && (
            <Button
              variant="outline"
              onClick={handleClear}
              className="rounded-xl border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all duration-200 ease-out"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
