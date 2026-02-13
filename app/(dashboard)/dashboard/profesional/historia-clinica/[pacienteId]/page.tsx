"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, ArrowLeft, RefreshCw, Edit } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface HistoriaClinicaRegistro {
  id: string
  fechaConsulta: string
  notas: string | null
  diagnostico: string | null
  tratamiento: string | null
  profesional: {
    user: {
      nombre: string
    }
    especialidad: string
  }
  turno: {
    fecha: string
    hora: string
    estado: string
    motivo: string | null
    motivoEliminacion: string | null
    eliminadoAt: Date | null
  } | null
  archivos: Array<{
    id: string
    nombreArchivo: string
    tipoArchivo: string
    urlArchivo: string
  }>
}

interface Paciente {
  id: string
  nombre: string
  dni: string | null
  email: string
  fechaNacimiento: Date | null
}

export default function HistoriaClinicaDetalleProfesionalPage() {
  const params = useParams()
  const pacienteId = params.pacienteId as string

  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [historiaClinica, setHistoriaClinica] = useState<HistoriaClinicaRegistro[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [pacienteId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [pacienteRes, historiaRes] = await Promise.all([
        fetch(`/api/pacientes/${pacienteId}`),
        fetch(`/api/historia-clinica/paciente/${pacienteId}`),
      ])

      if (!pacienteRes.ok) {
        throw new Error("Error al cargar datos del paciente")
      }

      const pacienteData = await pacienteRes.json()

      if (!historiaRes.ok) {
        console.error("Error cargando historia clínica:", await historiaRes.text())
        setPaciente(pacienteData)
        setHistoriaClinica([])
        setLoading(false)
        return
      }

      const historiaData = await historiaRes.json()

      setPaciente(pacienteData)
      // La API devuelve todas las historias clínicas del paciente
      setHistoriaClinica(Array.isArray(historiaData) ? historiaData : [])
      setLoading(false)
    } catch (error: any) {
      console.error("Error cargando datos:", error)
      setHistoriaClinica([])
      setLoading(false)
    }
  }

  const exportarPDF = async () => {
    try {
      const response = await fetch(`/api/historia-clinica/exportar/pdf?pacienteId=${pacienteId}`)
      if (!response.ok) {
        throw new Error("Error al exportar PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `historia_clinica_${paciente?.nombre || pacienteId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error.message || "Error al exportar PDF")
    }
  }

  const exportarDOC = async () => {
    try {
      const response = await fetch(`/api/historia-clinica/exportar/doc?pacienteId=${pacienteId}`)
      if (!response.ok) {
        throw new Error("Error al exportar DOC")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `historia_clinica_${paciente?.nombre || pacienteId}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error.message || "Error al exportar DOC")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando historia clínica...</p>
        </div>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Paciente no encontrado</p>
        <Link href="/dashboard/profesional/historia-clinica">
          <Button variant="outline" className="mt-4">
            Volver
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/profesional/historia-clinica">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Historia Clínica</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recargar
          </Button>
          <Button onClick={exportarPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={exportarDOC} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar DOC
          </Button>
          <Link href={`/dashboard/profesional/historia-clinica/${pacienteId}/editar`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nombre</p>
              <p className="font-semibold">{paciente.nombre}</p>
            </div>
            {paciente.dni && (
              <div>
                <p className="text-sm text-gray-500">DNI</p>
                <p className="font-semibold">{paciente.dni}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold">{paciente.email}</p>
            </div>
            {paciente.fechaNacimiento && (
              <div>
                <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                <p className="font-semibold">
                  {format(new Date(paciente.fechaNacimiento), "dd/MM/yyyy", {
                    locale: es,
                  })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros Médicos</CardTitle>
          <CardDescription>
            {historiaClinica.length} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historiaClinica.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay registros médicos disponibles
            </div>
          ) : (
            <div className="space-y-6">
              {historiaClinica.map((registro) => (
                <div
                  key={registro.id}
                  className="border rounded-lg p-6 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {registro.profesional.user.nombre}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {registro.profesional.especialidad}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Fecha de Consulta:{" "}
                        {format(new Date(registro.fechaConsulta), "dd/MM/yyyy HH:mm", {
                          locale: es,
                        })}
                      </p>
                      {registro.turno && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-500">
                            Turno:{" "}
                            {format(new Date(registro.turno.fecha), "dd/MM/yyyy", {
                              locale: es,
                            })}{" "}
                            - {registro.turno.hora}
                          </p>
                          {registro.turno.motivo && (
                            <p className="text-sm text-gray-500">
                              Motivo: {registro.turno.motivo}
                            </p>
                          )}
                          {registro.turno.estado === "ELIMINADO" && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                              <p className="text-sm font-semibold text-red-800 mb-1">
                                ⚠️ Turno Eliminado
                              </p>
                              {registro.turno.motivoEliminacion && (
                                <p className="text-sm text-red-700">
                                  <strong>Causa de eliminación:</strong> {registro.turno.motivoEliminacion}
                                </p>
                              )}
                              {registro.turno.eliminadoAt && (
                                <p className="text-xs text-red-600 mt-1">
                                  Fecha de eliminación:{" "}
                                  {format(new Date(registro.turno.eliminadoAt), "dd/MM/yyyy HH:mm", {
                                    locale: es,
                                  })}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {registro.notas && (
                    <div>
                      <h4 className="font-semibold mb-2">Observaciones</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{registro.notas}</p>
                    </div>
                  )}

                  {registro.diagnostico && (
                    <div>
                      <h4 className="font-semibold mb-2">Diagnóstico</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {registro.diagnostico}
                      </p>
                    </div>
                  )}

                  {registro.tratamiento && (
                    <div>
                      <h4 className="font-semibold mb-2">Tratamiento</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {registro.tratamiento}
                      </p>
                    </div>
                  )}

                  {registro.archivos.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Estudios Adjuntos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {registro.archivos.map((archivo) => (
                          <a
                            key={archivo.id}
                            href={archivo.urlArchivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{archivo.nombreArchivo}</span>
                            <span className="text-xs text-gray-500">
                              ({archivo.tipoArchivo})
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
