"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { iconography } from "@/lib/typography"
import { useAnalytics } from "@/lib/analytics"

interface Paciente {
  id: string
  nombre: string
  dni?: string | null
  email?: string | null
}

interface PatientSearchInputProps {
  value?: string
  onChange: (paciente: Paciente | null) => void
  onSearch?: (query: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export function PatientSearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "Buscar paciente...",
  autoFocus = false,
  className,
}: PatientSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const skipNextOpenRef = useRef(false)
  const { timeStart, timeEnd } = useAnalytics()

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Solo re-ejecutar cuando cambie searchQuery (timeStart/timeEnd cambian cada render y causaban bucle)
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      setShowResults(false)
      setLoading(false)
      return
    }

    const searchPatients = async () => {
      timeStart("patient_search")
      setLoading(true)

      try {
        const response = await fetch(
          `/api/pacientes/buscar?q=${encodeURIComponent(searchQuery)}`
        )
        const data = await response.json()
        setResults(data.pacientes || [])
        timeEnd("patient_search", { results_count: data.pacientes?.length || 0 })
        if (skipNextOpenRef.current) {
          skipNextOpenRef.current = false
        } else if (inputRef.current && document.activeElement === inputRef.current) {
          setShowResults(true)
        }
      } catch (error) {
        console.error("Error buscando pacientes:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchPatients, 300)
    return () => clearTimeout(debounceTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo searchQuery; timeStart/timeEnd inestables
  }, [searchQuery])

  const handleSelect = (paciente: Paciente) => {
    skipNextOpenRef.current = true
    setSearchQuery(paciente.nombre)
    setShowResults(false)
    onChange(paciente)
    if (onSearch) {
      onSearch(paciente.nombre)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && results.length > 0) {
      e.preventDefault()
      handleSelect(results[0])
    } else if (e.key === "Escape") {
      setShowResults(false)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search
          className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B]",
            iconography.text
          )}
          strokeWidth={iconography.strokeWidth}
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            if (e.target.value === "") {
              onChange(null)
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true)
            }
          }}
          className="pl-10 rounded-xl border-[#E2E8F0] focus:ring-[#2563EB]"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#64748B] animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-[#E2E8F0] rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {results.map((paciente) => (
            <button
              key={paciente.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSelect(paciente)
              }}
              className="w-full text-left px-4 py-3 hover:bg-[#F8FAFC] transition-colors duration-150 ease-out border-b border-[#E2E8F0] last:border-b-0 cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#0F172A]">
                  {paciente.nombre}
                </span>
                {paciente.dni && (
                  <span className="text-xs text-[#64748B] mt-0.5">
                    DNI: {paciente.dni}
                  </span>
                )}
                {paciente.email && (
                  <span className="text-xs text-[#64748B]">
                    {paciente.email}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
