import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { Plus, FilePlus } from "lucide-react"
import Link from "next/link"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { PatientProfileCard } from "@/components/historia-clinica/patient-profile-card"
import { MedicalInfoCard } from "@/components/historia-clinica/medical-info-card"
import { MedicalTimeline } from "@/components/historia-clinica/medical-timeline"
import { ExportarHistoriaButton } from "@/components/historia-clinica/exportar-historia-button"

export default async function HistoriaClinicaDetallePage({
  params,
}: {
  params: Promise<{ pacienteId: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const { pacienteId } = await params

  const pacienteRaw = await prisma.user.findUnique({
    where: { id: pacienteId },
    include: {
      obraSocialRel: { select: { nombre: true } },
    },
  })

  if (!pacienteRaw || pacienteRaw.role !== "PACIENTE") {
    notFound()
  }

  const ultimoTurno = await prisma.turno.findFirst({
    where: {
      pacienteId,
      estado: { in: ["CONFIRMADO", "COMPLETADO"] },
      eliminadoAt: null,
    },
    orderBy: { fecha: "desc" },
    include: {
      profesional: {
        select: {
          especialidad: true,
          user: { select: { nombre: true } },
        },
      },
    },
  })

  const pacienteTurnos = ultimoTurno?.profesional
    ? [
        {
          profesional: {
            user: { nombre: ultimoTurno.profesional.user?.nombre ?? "" },
            especialidad: ultimoTurno.profesional.especialidad,
          },
        },
      ]
    : []

  const paciente = {
    ...pacienteRaw,
    obraSocialRel: pacienteRaw.obraSocialRel,
    pacienteTurnos,
  }

  // Obtener historia clínica
  const historiaClinica = await prisma.historiaClinica.findMany({
    where: {
      pacienteId: pacienteId,
    },
    include: {
      profesional: {
        include: {
          user: {
            select: {
              nombre: true,
            },
          },
        },
      },
      turno: {
        select: {
          fecha: true,
          hora: true,
          estado: true,
          motivo: true,
          motivoEliminacion: true,
          eliminadoAt: true,
        },
      },
      archivos: {
        select: {
          id: true,
          nombreArchivo: true,
          tipoArchivo: true,
          urlArchivo: true,
        },
      },
    },
    orderBy: {
      fechaConsulta: "desc",
    },
  })

  // Obtener profesional asignado más reciente
  const profesionalAsignado =
    paciente.pacienteTurnos.length > 0
      ? {
          nombre:
            paciente.pacienteTurnos[0].profesional.user.nombre,
          especialidad: paciente.pacienteTurnos[0].profesional.especialidad,
        }
      : null

  // Extraer información médica de las notas (por ahora usar campos genéricos)
  // En el futuro esto podría venir de campos específicos en el schema
  const alergias = null // Se puede agregar al schema más adelante
  const enfermedadesCronicas = null
  const medicacionActual = null
  const observaciones = null

  return (
    <div className="space-y-6">
      {/* Breadcrumb y Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <Breadcrumb
            items={[
              { label: "Pacientes", href: "/dashboard/admin/pacientes" },
              { label: paciente.nombre, href: `/dashboard/admin/pacientes/${pacienteId}` },
              { label: "Historia clínica" },
            ]}
            className="mb-4"
          />
          <h1 className="text-2xl lg:text-3xl font-semibold text-[#0F172A] font-inter">
            Historia Clínica
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/admin/historia-clinica/${pacienteId}/agregar`}>
            <Button className="bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl font-medium px-6 transition-all duration-200 ease-out hover:scale-[1.02]">
              <FilePlus className="h-4 w-4 mr-2" />
              Agregar historia clínica
            </Button>
          </Link>
          <Link href={`/dashboard/admin/historia-clinica/${pacienteId}/editar`}>
            <Button className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium px-6 transition-all duration-200 ease-out hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-2" />
              Nueva evolución
            </Button>
          </Link>
          <ExportarHistoriaButton
            pacienteId={pacienteId}
            pacienteNombre={paciente.nombre}
          />
        </div>
      </div>

      {/* Layout 2 columnas */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Perfil del paciente */}
        <div className="lg:col-span-1 space-y-6">
          <PatientProfileCard
            paciente={{
              nombre: paciente.nombre,
              dni: paciente.dni,
              email: paciente.email,
              telefono: paciente.telefono,
              fechaNacimiento: paciente.fechaNacimiento,
              obraSocial: paciente.obraSocial,
              obraSocialRel: paciente.obraSocialRel,
            }}
            profesionalAsignado={profesionalAsignado}
          />

          <MedicalInfoCard
            alergias={alergias}
            enfermedadesCronicas={enfermedadesCronicas}
            medicacionActual={medicacionActual}
            observaciones={observaciones}
          />
        </div>

        {/* Columna derecha - Historial clínico */}
        <div className="lg:col-span-2">
          <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
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
                registros={historiaClinica as any}
                basePath={`/dashboard/admin/historia-clinica/${pacienteId}`}
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
