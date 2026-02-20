"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FilePlus, Plus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { PatientProfileCard } from "@/components/historia-clinica/patient-profile-card"
import { MedicalInfoCard } from "@/components/historia-clinica/medical-info-card"
import { MedicalTimeline } from "@/components/historia-clinica/medical-timeline"
import { ExportarHistoriaButton } from "@/components/historia-clinica/exportar-historia-button"

interface HistoriaClinicaRegistro {
  id: string
  fechaConsulta: string
  notas: string | null
  diagnostico: string | null
  tratamiento: string | null
  profesional: {
    user: { nombre: string }
    especialidad: string
  }
  turno: {
    fecha: string
    hora: string
    estado: string
    motivo?: string | null
    motivoEliminacion?: string | null
    eliminadoAt?: Date | string | null
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
  fechaNacimiento?: string | null
  telefono?: string | null
  obraSocial?: string | null
}

export default function HistoriaClinicaDetalleSecretariaPage() {
  const params = useParams()
  const pacienteId = params.pacienteId as string

  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [historiaClinica, setHistoriaClinica] = useState<HistoriaClinicaRegistro[]>([])
  const [loading, setLoading] = useState(true)

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
        setPaciente(pacienteData)
        setHistoriaClinica([])
        setLoading(false)
        return
      }

      const historiaData = await historiaRes.json()
      const registros = Array.isArray(historiaData) ? historiaData : []
      setPaciente(pacienteData)
      setHistoriaClinica(registros)
    } catch (error) {
      console.error("Error cargando datos:", error)
      setHistoriaClinica([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchData depende de pacienteId
  }, [pacienteId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-[#64748B]">Cargando historia clínica...</p>
        </div>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="text-center py-8">
        <p className="text-[#64748B]">Paciente no encontrado</p>
        <Link href="/dashboard/secretaria/historia-clinica">
          <Button variant="outline" className="mt-4">
            Volver
          </Button>
        </Link>
      </div>
    )
  }

  const registrosParaTimeline = historiaClinica.map((r) => ({
    ...r,
    motivo: r.turno?.motivo ?? r.notas,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <Breadcrumb
            items={[
              { label: "Inicio", href: "/dashboard/secretaria" },
              { label: "Historia clínica", href: "/dashboard/secretaria/historia-clinica" },
              { label: paciente.nombre },
            ]}
            className="mb-4"
          />
          <div className="flex items-center gap-2">
            <Link href="/dashboard/secretaria/historia-clinica">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recargar
            </Button>
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-[#0F172A] font-inter mt-2">
            Historia Clínica
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/secretaria/historia-clinica/${pacienteId}/agregar`}>
            <Button className="bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl font-medium px-6 transition-all duration-200 ease-out hover:scale-[1.02]">
              <FilePlus className="h-4 w-4 mr-2" />
              Agregar historia clínica
            </Button>
          </Link>
          <Link href={`/dashboard/secretaria/historia-clinica/${pacienteId}/editar`}>
            <Button className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium px-6 transition-all duration-200 ease-out hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-2" />
              Nueva evolución
            </Button>
          </Link>
          <ExportarHistoriaButton
            pacienteId={pacienteId}
            pacienteNombre={paciente.nombre ?? ""}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <PatientProfileCard
            paciente={{
              nombre: paciente.nombre,
              dni: paciente.dni ?? null,
              email: paciente.email,
              telefono: paciente.telefono ?? null,
              fechaNacimiento: paciente.fechaNacimiento ? new Date(paciente.fechaNacimiento) : null,
              obraSocial: paciente.obraSocial ?? null,
              obraSocialRel: null,
            }}
            profesionalAsignado={null}
          />
          <MedicalInfoCard
            alergias={null}
            enfermedadesCronicas={null}
            medicacionActual={null}
            observaciones={null}
          />
        </div>

        <div className="lg:col-span-2">
          <Card className="bg-white/95 border border-[#E2E8F0] rounded-xl shadow-sm">
            <CardHeader className="border-b border-[#E2E8F0]">
              <CardTitle className="text-lg font-semibold text-[#0F172A] font-inter">
                Historial Clínico
              </CardTitle>
              <p className="text-sm text-[#64748B] mt-1">
                {historiaClinica.length} registro
                {historiaClinica.length !== 1 ? "s" : ""} médico
                {historiaClinica.length !== 1 ? "s" : ""}
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <MedicalTimeline
                registros={registrosParaTimeline as any}
                basePath={`/dashboard/secretaria/historia-clinica/${pacienteId}`}
                pacienteId={pacienteId}
                pacienteNombre={paciente.nombre ?? ""}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
