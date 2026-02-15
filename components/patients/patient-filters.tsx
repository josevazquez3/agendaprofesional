"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
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

const DEBOUNCE_MS = 400

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

  const applyParams = useCallback(
    (nextSearch: string, nextObraId: string, nextProfId: string) => {
      const params = new URLSearchParams()
      if (nextSearch.trim()) params.set("search", nextSearch.trim())
      if (nextObraId) params.set("obraSocialId", nextObraId)
      if (nextProfId) params.set("profesionalId", nextProfId)
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [pathname, router]
  )

  const handleObraSocialChange = (value: string) => {
    setObraSocialId(value)
    applyParams(search, value, profesionalId)
  }

  const handleProfesionalChange = (value: string) => {
    setProfesionalId(value)
    applyParams(search, obraSocialId, value)
  }

  const handleClear = () => {
    setSearch("")
    setObraSocialId("")
    setProfesionalId("")
    router.push(pathname)
  }

  const hasFilters = search || obraSocialId || profesionalId
  const isFirstMount = useRef(true)

  // Búsqueda a tiempo real con debounce al escribir (no aplicar en el primer montaje)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    const t = setTimeout(() => {
      applyParams(search, obraSocialId, profesionalId)
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debounce cuando cambia search
  }, [search])

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
                applyParams(search, obraSocialId, profesionalId)
              }
            }}
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 flex-1">
          {obrasSociales.length > 0 && (
            <select
              value={obraSocialId}
              onChange={(e) => handleObraSocialChange(e.target.value)}
              className="min-w-[180px] rounded-xl border-[#E2E8F0] focus:ring-[#2563EB] px-3 py-2"
            >
              <option value="">Todas las obras sociales</option>
              {obrasSociales.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.nombre}
                </option>
              ))}
            </select>
          )}

          {profesionales.length > 0 && (
            <select
              value={profesionalId}
              onChange={(e) => handleProfesionalChange(e.target.value)}
              className="min-w-[200px] rounded-xl border-[#E2E8F0] focus:ring-[#2563EB] px-3 py-2"
            >
              <option value="">Todos los profesionales</option>
              {profesionales.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.user.nombre} - {prof.especialidad}
                </option>
              ))}
            </select>
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
