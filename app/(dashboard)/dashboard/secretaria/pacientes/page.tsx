"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Eye, FileText } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Paciente {
  id: string
  nombre: string
  dni: string | null
  email: string
  telefono: string | null
  fechaNacimiento: Date | null
}

export default function SecretariaPacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [pacientesFiltrados, setPacientesFiltrados] = useState<Paciente[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPacientes()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial
  }, [])

  const filtrarPacientes = useCallback(() => {
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
  }, [busqueda, pacientes])

  useEffect(() => {
    filtrarPacientes()
  }, [filtrarPacientes])

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pacientes</h1>

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
                      {paciente.telefono && (
                        <span>Teléfono: {paciente.telefono}</span>
                      )}
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
                    <Link href={`/dashboard/secretaria/historia-clinica/${paciente.id}`}>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Historia Clínica
                      </Button>
                    </Link>
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
