"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, ArrowLeft, X, FileText } from "lucide-react"
import Link from "next/link"

interface Paciente {
  id: string
  nombre: string
  dni: string | null
  email: string
}

interface HistoriaClinicaRegistro {
  id: string
  fechaConsulta: string
  profesional: {
    user: {
      nombre: string
    }
    especialidad: string
  }
}

export default function NuevoEstudioPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [historiaClinica, setHistoriaClinica] = useState<HistoriaClinicaRegistro[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Guard clause: verificar que el usuario tenga permisos
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated" && session?.user?.role) {
      const role = session.user.role
      const allowedRoles = ["ADMIN", "SECRETARIA", "PROFESIONAL"]
      if (!allowedRoles.includes(role)) {
        router.push("/dashboard")
        return
      }
    }
  }, [status, session, router])
  const [formData, setFormData] = useState({
    pacienteId: "",
    historiaClinicaId: "",
    nombreArchivo: "",
    tipoArchivo: "PDF",
    contenido: "",
    archivo: null as File | null,
  })

  const validateFileType = (file: File): boolean => {
    const allowedExtensions = [".pdf", ".docx"]
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    
    return (
      allowedTypes.includes(file.type) ||
      allowedExtensions.includes(fileExtension)
    )
  }

  useEffect(() => {
    fetchPacientes()
  }, [])

  useEffect(() => {
    if (formData.pacienteId) {
      fetchHistoriaClinica()
    } else {
      setHistoriaClinica([])
    }
  }, [formData.pacienteId])

  const fetchPacientes = async () => {
    try {
      const response = await fetch("/api/pacientes")
      if (!response.ok) {
        throw new Error("Error al cargar pacientes")
      }
      const data = await response.json()
      setPacientes(data)
      setLoadingData(false)
    } catch (error) {
      console.error("Error cargando pacientes:", error)
      setLoadingData(false)
    }
  }

  const fetchHistoriaClinica = async () => {
    try {
      const response = await fetch(`/api/historia-clinica/paciente/${formData.pacienteId}`)
      if (!response.ok) {
        throw new Error("Error al cargar historia clínica")
      }
      const data = await response.json()
      setHistoriaClinica(data)
    } catch (error) {
      console.error("Error cargando historia clínica:", error)
      setHistoriaClinica([])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!validateFileType(file)) {
        alert("Solo se permiten archivos PDF y DOCX")
        e.target.value = ""
        return
      }

      const extension = file.name.split(".").pop()?.toUpperCase() || "PDF"
      const tipoArchivo = extension === "DOCX" ? "DOCX" : "PDF"

      setFormData({
        ...formData,
        archivo: file,
        nombreArchivo: file.name,
        tipoArchivo,
      })
    }
  }

  const validateForm = (): string | null => {
    if (!formData.pacienteId) {
      return "Seleccione un paciente"
    }

    if (!formData.historiaClinicaId) {
      return "Seleccione un registro de historia clínica"
    }

    if (!formData.nombreArchivo.trim()) {
      return "Ingrese el nombre del estudio"
    }

    if (!formData.archivo) {
      return "Debe subir un archivo"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación temprana en frontend para mejor UX
    const validationError = validateForm()
    if (validationError) {
      alert(validationError)
      return
    }

    setLoading(true)

    try {

      // Subir archivo
      const formDataUpload = new FormData()
      formDataUpload.append("file", formData.archivo!)
      formDataUpload.append("historiaClinicaId", formData.historiaClinicaId)

      const uploadResponse = await fetch("/api/upload/estudios", {
        method: "POST",
        body: formDataUpload,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "Error al subir archivo")
      }

      const uploadData = await uploadResponse.json()
      const urlArchivo = uploadData.url

      // Crear el archivo en la historia clínica
      const response = await fetch(`/api/historia-clinica/${formData.historiaClinicaId}/estudios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreArchivo: formData.nombreArchivo,
          tipoArchivo: formData.tipoArchivo,
          urlArchivo,
          tamano: formData.archivo!.size,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar estudio")
      }

      alert("Estudio cargado exitosamente")
      // Redirigir según el rol del usuario
      const userRole = session?.user?.role
      
      if (userRole === "ADMIN") {
        router.push(`/dashboard/admin/historia-clinica/${formData.pacienteId}`)
      } else if (userRole === "SECRETARIA") {
        router.push(`/dashboard/secretaria/historia-clinica/${formData.pacienteId}`)
      } else if (userRole === "PROFESIONAL") {
        router.push(`/dashboard/profesional/historia-clinica/${formData.pacienteId}`)
      } else {
        router.push(`/dashboard/admin/historia-clinica/${formData.pacienteId}`)
      }
    } catch (error: any) {
      alert(error.message || "Error al cargar estudio")
      setLoading(false)
    }
  }

  // Mostrar loading mientras se verifica la sesión o carga datos
  if (status === "loading" || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado o no tiene permisos, no mostrar nada (el useEffect redirige)
  if (status === "unauthenticated" || !session?.user) {
    return null
  }

  const userRole = session.user.role
  const allowedRoles = ["ADMIN", "SECRETARIA", "PROFESIONAL"]
  if (!allowedRoles.includes(userRole)) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Cargar Estudio Médico</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Estudio</CardTitle>
          <CardDescription>
            Complete los datos para cargar un nuevo estudio médico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pacienteId">Paciente *</Label>
              <select
                id="pacienteId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.pacienteId}
                onChange={(e) =>
                  setFormData({ ...formData, pacienteId: e.target.value, historiaClinicaId: "" })
                }
                required
              >
                <option value="">Seleccione un paciente</option>
                {pacientes.map((paciente) => (
                  <option key={paciente.id} value={paciente.id}>
                    {paciente.nombre} {paciente.dni && `- DNI: ${paciente.dni}`}
                  </option>
                ))}
              </select>
            </div>

            {formData.pacienteId && historiaClinica.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="historiaClinicaId">Registro de Historia Clínica *</Label>
                <select
                  id="historiaClinicaId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.historiaClinicaId}
                  onChange={(e) =>
                    setFormData({ ...formData, historiaClinicaId: e.target.value })
                  }
                  required
                >
                  <option value="">Seleccione un registro</option>
                  {historiaClinica.map((registro) => (
                    <option key={registro.id} value={registro.id}>
                      {new Date(registro.fechaConsulta).toLocaleDateString("es-AR")} -{" "}
                      {registro.profesional.user.nombre} ({registro.profesional.especialidad})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.pacienteId && historiaClinica.length === 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  ⚠️ Este paciente aún no tiene historia clínica
                </p>
                <p className="text-sm text-blue-700">
                  Para cargar un estudio, primero debe crear un registro de historia clínica completando un turno o agregando una evolución médica.
                </p>
                <div className="mt-3 flex gap-2">
                  <Link href="/dashboard/historia-clinica/nueva">
                    <Button type="button" variant="outline" size="sm" className="text-blue-700 border-blue-300">
                      Crear nueva evolución
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nombreArchivo">Nombre del Estudio *</Label>
              <Input
                id="nombreArchivo"
                value={formData.nombreArchivo}
                onChange={(e) =>
                  setFormData({ ...formData, nombreArchivo: e.target.value })
                }
                placeholder="Ej: Análisis de sangre, Radiografía de tórax..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoArchivo">Tipo de Archivo *</Label>
                <select
                  id="tipoArchivo"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.tipoArchivo}
                  onChange={(e) =>
                    setFormData({ ...formData, tipoArchivo: e.target.value })
                  }
                  required
                >
                  <option value="PDF">PDF</option>
                  <option value="DOCX">DOCX</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="archivo">Archivo *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="archivo"
                    type="file"
                    accept={
                      formData.tipoArchivo === "PDF"
                        ? ".pdf"
                        : ".docx"
                    }
                    onChange={handleFileChange}
                    className="flex-1"
                    required
                  />
                  {formData.archivo && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>{formData.archivo.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFormData({ ...formData, archivo: null, nombreArchivo: "" })
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Solo se permiten archivos PDF y DOCX
                </p>
              </div>
            </div>


            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={
                  loading || 
                  !formData.pacienteId || 
                  !formData.historiaClinicaId ||
                  !formData.archivo
                }
              >
                <Upload className="h-4 w-4 mr-2" />
                {loading ? "Cargando..." : "Cargar Estudio"}
              </Button>
              <Link href="/dashboard">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
