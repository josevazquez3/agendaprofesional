"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Filter, X } from "lucide-react"

interface TurnosFiltrosProps {
  profesionales: Array<{
    id: string
    user: {
      nombre: string
    }
    especialidad: string
  }>
}

export function TurnosFiltros({ profesionales }: TurnosFiltrosProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [profesionalId, setProfesionalId] = useState(
    searchParams.get("profesionalId") || ""
  )
  const [estado, setEstado] = useState(searchParams.get("estado") || "")
  const [fecha, setFecha] = useState(searchParams.get("fecha") || "")

  useEffect(() => {
    setProfesionalId(searchParams.get("profesionalId") || "")
    setEstado(searchParams.get("estado") || "")
    setFecha(searchParams.get("fecha") || "")
  }, [searchParams])

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (profesionalId) params.set("profesionalId", profesionalId)
    if (estado) params.set("estado", estado)
    if (fecha) params.set("fecha", fecha)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleClear = () => {
    setProfesionalId("")
    setEstado("")
    setFecha("")
    router.push(pathname)
  }

  const hasFilters = profesionalId || estado || fecha

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h3 className="font-semibold">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="profesional">Profesional</Label>
            <select
              id="profesional"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={profesionalId}
              onChange={(e) => setProfesionalId(e.target.value)}
            >
              <option value="">Todos los profesionales</option>
              {profesionales.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.user.nombre} - {prof.especialidad}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <select
              id="estado"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="COMPLETADO">Completado</option>
              <option value="ELIMINADO">Eliminados</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleFilter} className="flex-1">
              Filtrar
            </Button>
            {hasFilters && (
              <Button variant="outline" onClick={handleClear}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
