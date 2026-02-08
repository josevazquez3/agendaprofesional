"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"

interface PatientFiltersProps {
  obrasSociales?: Array<{ id: string; nombre: string }>
  profesionales?: Array<{
    id: string
    user: { nombre: string }
    especialidad: string
  }>
}

export function PatientFilters({
  obrasSociales = [],
  profesionales = [],
}: PatientFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [obraSocialId, setObraSocialId] = useState(
    searchParams.get("obraSocialId") || ""
  )
  const [profesionalId, setProfesionalId] = useState(
    searchParams.get("profesionalId") || ""
  )

  useEffect(() => {
    setSearch(searchParams.get("search") || "")
    setObraSocialId(searchParams.get("obraSocialId") || "")
    setProfesionalId(searchParams.get("profesionalId") || "")
  }, [searchParams])

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (obraSocialId) params.set("obraSocialId", obraSocialId)
    if (profesionalId) params.set("profesionalId", profesionalId)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleClear = () => {
    setSearch("")
    setObraSocialId("")
    setProfesionalId("")
    router.push(pathname)
  }

  const hasFilters = search || obraSocialId || profesionalId

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Buscador */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#64748B]" />
          <Input
            type="text"
            placeholder="Buscar paciente por nombre, DNI o email..."
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
          {obrasSociales.length > 0 && (
            <Select
              value={obraSocialId}
              onChange={(e) => setObraSocialId(e.target.value)}
              className="min-w-[180px]"
            >
              <option value="">Todas las obras sociales</option>
              {obrasSociales.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.nombre}
                </option>
              ))}
            </Select>
          )}

          {profesionales.length > 0 && (
            <Select
              value={profesionalId}
              onChange={(e) => setProfesionalId(e.target.value)}
              className="min-w-[200px]"
            >
              <option value="">Todos los profesionales</option>
              {profesionales.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.user.nombre} - {prof.especialidad}
                </option>
              ))}
            </Select>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-xl border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all duration-200 ease-out"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros avanzados
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
