"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, X, FileText } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface HistoriaClinicaRegistro {
  id: string
  fechaConsulta: string
  updatedAt?: string
  notas: string | null
  diagnostico: string | null
  tratamiento: string | null
  profesional: {
    id: string
    user: {
      nombre: string
    }
    especialidad: string
  }
  turno: {
    fecha: string
    hora: string
    estado: string
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
}

interface Estudio {
  nombreArchivo: string
  contenido: string
  tipoArchivo: string
}

export default function EditarHistoriaClinicaProfesionalPage() {
  const params = useParams()
  const router = useRouter()
  const pacienteId = params.pacienteId as string

  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [historiaClinica, setHistoriaClinica] = useState<HistoriaClinicaRegistro[]>([])
  const [loading, setLoading] = useState(true)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    notas: "",
    diagnostico: "",
    tratamiento: "",
  })
  const [nuevoEstudio, setNuevoEstudio] = useState<Estudio>({
    nombreArchivo: "",
    contenido: "",
    tipoArchivo: "TEXTO",
  })
  const [estudios, setEstudios] = useState<Estudio[]>([])

  useEffect(() => {
    fetchData()
  }, [pacienteId])

  const fetchData = async () => {
    try {
      const [pacienteRes, historiaRes] = await Promise.all([
        fetch(`/api/pacientes/${pacienteId}`),
        fetch(`/api/historia-clinica/paciente/${pacienteId}`),
      ])

      if (!pacienteRes.ok || !historiaRes.ok) {
        throw new Error("Error al cargar datos")
      }

      const pacienteData = await pacienteRes.json()
      const historiaData = await historiaRes.json()

      setPaciente(pacienteData)
      setHistoriaClinica(Array.isArray(historiaData) ? historiaData : [])
      setLoading(false)
    } catch (error) {
      console.error("Error cargando datos:", error)
      setLoading(false)
    }
  }

  const iniciarEdicion = (registro: HistoriaClinicaRegistro) => {
    setEditandoId(registro.id)
    setFormData({
      notas: registro.notas || "",
      diagnostico: registro.diagnostico || "",
      tratamiento: registro.tratamiento || "",
    })
    setEstudios(
      registro.archivos.map((archivo) => ({
        nombreArchivo: archivo.nombreArchivo,
        contenido: archivo.urlArchivo,
        tipoArchivo: archivo.tipoArchivo,
      }))
    )
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setFormData({ notas: "", diagnostico: "", tratamiento: "" })
    setEstudios([])
  }

  const guardarCambios = async (registroId: string) => {
    try {
      // Obtener el registro actual para incluir versión (usar updatedAt si está disponible)
      const registroActual = historiaClinica.find((r) => r.id === registroId)
      const version = registroActual?.updatedAt 
        ? registroActual.updatedAt 
        : registroActual 
        ? new Date(registroActual.fechaConsulta).toISOString() 
        : undefined

      const response = await fetch(`/api/historia-clinica/${registroId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          estudios,
          version,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Manejar conflicto de concurrencia
        if (response.status === 409 && errorData.conflict) {
          if (confirm("Este registro fue modificado por otro usuario. ¿Desea recargar y volver a intentar?")) {
            await fetchData()
            return
          }
          throw new Error(errorData.error || "El registro fue modificado por otro usuario")
        }
        
        // Manejar error de permisos
        if (response.status === 403) {
          throw new Error(errorData.error || "No tiene permisos para editar este registro")
        }
        
        throw new Error(errorData.error || "Error al guardar cambios")
      }

      alert("Cambios guardados exitosamente")
      setEditandoId(null)
      await fetchData()
    } catch (error: any) {
      alert(error.message || "Error al guardar cambios")
    }
  }

  const agregarEstudio = () => {
    if (!nuevoEstudio.nombreArchivo.trim() || !nuevoEstudio.contenido.trim()) {
      alert("Complete el nombre y contenido del estudio")
      return
    }

    setEstudios([...estudios, nuevoEstudio])
    setNuevoEstudio({
      nombreArchivo: "",
      contenido: "",
      tipoArchivo: "TEXTO",
    })
  }

  const eliminarEstudio = (index: number) => {
    setEstudios(estudios.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/profesional/historia-clinica/${pacienteId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Editar Historia Clínica</h1>
        </div>
      </div>

      {paciente && (
        <Card>
          <CardHeader>
            <CardTitle>Paciente: {paciente.nombre}</CardTitle>
            {paciente.dni && (
              <CardDescription>DNI: {paciente.dni}</CardDescription>
            )}
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registros Médicos</CardTitle>
        </CardHeader>
        <CardContent>
          {historiaClinica.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay registros médicos disponibles
            </div>
          ) : (
            <div className="space-y-6">
              {historiaClinica.map((registro) => (
                <div key={registro.id} className="border rounded-lg p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {registro.profesional.user.nombre}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {registro.profesional.especialidad}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
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
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {editandoId === registro.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => guardarCambios(registro.id)}
                          >
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelarEdicion}
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => iniciarEdicion(registro)}
                        >
                          Editar
                        </Button>
                      )}
                    </div>
                  </div>

                  {editandoId === registro.id ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="notas">Observaciones</Label>
                        <textarea
                          id="notas"
                          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={formData.notas}
                          onChange={(e) =>
                            setFormData({ ...formData, notas: e.target.value })
                          }
                          placeholder="Observaciones del médico..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="diagnostico">Diagnóstico</Label>
                        <textarea
                          id="diagnostico"
                          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={formData.diagnostico}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              diagnostico: e.target.value,
                            })
                          }
                          placeholder="Diagnóstico..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="tratamiento">Tratamiento</Label>
                        <textarea
                          id="tratamiento"
                          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={formData.tratamiento}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tratamiento: e.target.value,
                            })
                          }
                          placeholder="Tratamiento indicado..."
                        />
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-4">Estudios Médicos</h4>
                        <div className="space-y-4">
                          {estudios.map((estudio, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 p-3 border rounded"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{estudio.nombreArchivo}</p>
                                {estudio.contenido && !estudio.contenido.startsWith("data:") && (
                                  <a
                                    href={estudio.contenido}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    Ver archivo
                                  </a>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  Tipo: {estudio.tipoArchivo}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => eliminarEstudio(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}

                          <div className="border rounded p-4 space-y-3">
                            <div>
                              <Label htmlFor="nombreEstudio">Nombre del Estudio</Label>
                              <Input
                                id="nombreEstudio"
                                value={nuevoEstudio.nombreArchivo}
                                onChange={(e) =>
                                  setNuevoEstudio({
                                    ...nuevoEstudio,
                                    nombreArchivo: e.target.value,
                                  })
                                }
                                placeholder="Ej: Análisis de sangre, Radiografía..."
                              />
                            </div>
                            <div>
                              <Label htmlFor="contenidoEstudio">Contenido</Label>
                              <textarea
                                id="contenidoEstudio"
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={nuevoEstudio.contenido}
                                onChange={(e) =>
                                  setNuevoEstudio({
                                    ...nuevoEstudio,
                                    contenido: e.target.value,
                                  })
                                }
                                placeholder="Descripción o resultados del estudio..."
                              />
                            </div>
                            <div>
                              <Label htmlFor="tipoEstudio">Tipo</Label>
                              <select
                                id="tipoEstudio"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={nuevoEstudio.tipoArchivo}
                                onChange={(e) =>
                                  setNuevoEstudio({
                                    ...nuevoEstudio,
                                    tipoArchivo: e.target.value,
                                  })
                                }
                              >
                                <option value="TEXTO">Texto</option>
                                <option value="PDF">PDF</option>
                                <option value="DOC">DOC</option>
                                <option value="JPG">JPG</option>
                                <option value="PNG">PNG</option>
                              </select>
                            </div>
                            <Button onClick={agregarEstudio} size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar Estudio
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {registro.notas && (
                        <div>
                          <h4 className="font-semibold mb-2">Observaciones</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {registro.notas}
                          </p>
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
                    </>
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
