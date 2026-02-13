"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PatientSearchInput } from "@/components/forms/patient-search-input"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"

interface Paciente {
  id: string
  nombre: string
  dni?: string | null
  email?: string | null
}

export default function NuevaEvolucionPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null)

  const handlePacienteSelect = (paciente: Paciente | null) => {
    setPacienteSeleccionado(paciente)
  }

  const handleContinuar = () => {
    if (!pacienteSeleccionado) {
      alert("Por favor seleccione un paciente")
      return
    }

    // Redirigir según el rol del usuario
    const role = session?.user?.role
    if (role === "ADMIN") {
      router.push(`/dashboard/admin/historia-clinica/${pacienteSeleccionado.id}/editar`)
    } else if (role === "SECRETARIA") {
      router.push(`/dashboard/secretaria/historia-clinica/${pacienteSeleccionado.id}`)
    } else if (role === "PROFESIONAL") {
      router.push(`/dashboard/profesional/historia-clinica/${pacienteSeleccionado.id}/editar`)
    } else {
      alert("No tiene permisos para crear evoluciones")
    }
  }

  // Determinar la ruta de retorno según el rol
  const getBackRoute = () => {
    const role = session?.user?.role
    if (role === "ADMIN") {
      return "/dashboard/admin"
    } else if (role === "SECRETARIA") {
      return "/dashboard/secretaria"
    } else if (role === "PROFESIONAL") {
      return "/dashboard/profesional"
    }
    return "/dashboard"
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={getBackRoute()}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nueva Evolución Clínica</h1>
          <p className="text-gray-600 mt-1">
            Seleccione un paciente para crear una nueva evolución
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Buscar Paciente
          </CardTitle>
          <CardDescription>
            Busque el paciente por nombre completo, nombre y apellido, DNI o email para crear una nueva evolución clínica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="paciente">Paciente *</Label>
            <PatientSearchInput
              onChange={handlePacienteSelect}
              autoFocus={true}
              placeholder="Buscar paciente por nombre, apellido, DNI o email..."
            />
          </div>

          {pacienteSeleccionado && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {pacienteSeleccionado.nombre}
                  </p>
                  {pacienteSeleccionado.dni && (
                    <p className="text-sm text-gray-600 mt-1">
                      DNI: {pacienteSeleccionado.dni}
                    </p>
                  )}
                  {pacienteSeleccionado.email && (
                    <p className="text-sm text-gray-600">
                      Email: {pacienteSeleccionado.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Link href={getBackRoute()}>
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button
              onClick={handleContinuar}
              disabled={!pacienteSeleccionado}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
            >
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
