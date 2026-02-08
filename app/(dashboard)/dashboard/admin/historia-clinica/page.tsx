"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, Eye, Edit, Trash2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Paciente {
  id: string
  nombre: string
  dni: string | null
  email: string
  fechaNacimiento: Date | null
}

export default function HistoriaClinicaAdminPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [pacientesFiltrados, setPacientesFiltrados] = useState<Paciente[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPacientes()
  }, [])

  useEffect(() => {
    filtrarPacientes()
  }, [busqueda, pacientes])

  const fetchPacientes = async () => {
    try {
      const response = await fetch("/api/pacientes")
      if (!response.ok) {
        throw new Error("Error al cargar pacientes")
      }
      const data = await response.json()
      setPacientes(data)
      setPacientesFiltrados(data)
      setLoading(false)
    } catch (error) {
      console.error("Error cargando pacientes:", error)
      setLoading(false)
    }
  }

  const filtrarPacientes = () => {
    if (!busqueda.trim()) {
      setPacientesFiltrados(pacientes)
      return
    }

    const termino = busqueda.toLowerCase().trim()
    const filtrados = pacientes.filter((paciente) => {
      const nombreCompleto = paciente.nombre.toLowerCase()
      const dni = paciente.dni?.toLowerCase() || ""
      const apellido = nombreCompleto.split(" ").slice(-1)[0] || ""
      
      return (
        nombreCompleto.includes(termino) ||
        dni.includes(termino) ||
        apellido.includes(termino)
      )
    })
    setPacientesFiltrados(filtrados)
  }

  const handleEliminar = async (pacienteId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar la historia clínica de este paciente?")) {
      return
    }

    try {
      const response = await fetch(`/api/historia-clinica/paciente/${pacienteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar historia clínica")
      }

      alert("Historia clínica eliminada exitosamente")
      fetchPacientes()
    } catch (error: any) {
      alert(error.message || "Error al eliminar historia clínica")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pacientes...</p>
        </div>
      </div>
    )
  }

  const migrarTurnosCompletados = async () => {
    if (!confirm("¿Desea crear historias clínicas para todos los turnos completados que no tienen registro?")) {
      return
    }

    try {
      const response = await fetch("/api/historia-clinica/migrar-turnos", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Error al migrar turnos")
      }

      const data = await response.json()
      alert(data.message || "Migración completada")
      await fetchPacientes()
    } catch (error: any) {
      alert(error.message || "Error al migrar turnos")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Historia Clínica</h1>
        <Button onClick={migrarTurnosCompletados} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Migrar Turnos Completados
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscador de Pacientes</CardTitle>
          <CardDescription>
            Busque por DNI, nombre o apellido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar por DNI, nombre o apellido..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {pacientesFiltrados.length} paciente(s) encontrado(s)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Pacientes</CardTitle>
          <CardDescription>
            Total: {pacientesFiltrados.length} paciente(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pacientesFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {busqueda ? "No se encontraron pacientes" : "No hay pacientes registrados"}
            </div>
          ) : (
            <div className="space-y-4">
              {pacientesFiltrados.map((paciente) => (
                <div
                  key={paciente.id}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{paciente.nombre}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      {paciente.dni && (
                        <span>DNI: {paciente.dni}</span>
                      )}
                      <span>Email: {paciente.email}</span>
                      {paciente.fechaNacimiento && (
                        <span>
                          Fecha de Nacimiento:{" "}
                          {format(new Date(paciente.fechaNacimiento), "dd/MM/yyyy", {
                            locale: es,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/admin/historia-clinica/${paciente.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    </Link>
                    <Link href={`/dashboard/admin/historia-clinica/${paciente.id}/editar`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleEliminar(paciente.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
