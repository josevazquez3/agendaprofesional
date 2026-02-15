import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { getUsers, countUsers } from "@/lib/user-helpers"
import { getProfesionales } from "@/lib/profesional-helpers"
import { getObrasSociales } from "@/lib/obra-social-helpers"
import Link from "next/link"
import { Plus } from "lucide-react"
import { PatientFilters } from "@/components/patients/patient-filters"
import { PatientTable } from "@/components/patients/patient-table"
import { PatientSummaryPanel } from "@/components/patients/patient-summary-panel"

export default async function AdminPacientesPage({
  searchParams,
}: {
  searchParams: {
    search?: string
    obraSocialId?: string
    profesionalId?: string
  }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  // Obtener pacientes con última visita usando helper
  const pacientes = await getUsers({
    role: "PACIENTE",
    search: searchParams.search,
    obraSocialId: searchParams.obraSocialId,
    includeObraSocial: true,
    includeUltimaVisita: true,
    orderBy: { nombre: "asc" },
  })

  // Formatear pacientes con última visita
  const pacientesFormateados = pacientes.map((paciente) => ({
    id: paciente.id,
    nombre: paciente.nombre,
    dni: paciente.dni,
    email: paciente.email,
    telefono: paciente.telefono,
    obraSocial: paciente.obraSocial,
    obraSocialRel: paciente.obraSocialRel,
    ultimaVisita:
      paciente.pacienteTurnos && paciente.pacienteTurnos.length > 0
        ? paciente.pacienteTurnos[0].fecha
        : null,
  }))

  // Obtener obras sociales para filtros
  const obrasSocialesRaw = await getObrasSociales({
    activa: true,
    orderBy: { nombre: "asc" },
  })
  const obrasSociales = obrasSocialesRaw.map((os) => ({
    id: os.id,
    nombre: os.nombre,
  }))

  // Obtener profesionales para filtros
  const profesionalesRaw = await getProfesionales({
    includeUser: true,
    includeUserFields: ["nombre"],
  })
  
  // Formatear profesionales para el componente
  const profesionales = profesionalesRaw
    .filter((p) => p.user) // Solo incluir profesionales con usuario
    .map((p) => ({
      id: p.id,
      user: { nombre: p.user!.nombre },
      especialidad: p.especialidad,
    }))

  // Calcular estadísticas
  const totalPacientes = pacientes.length

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const nuevosEsteMes = await countUsers({
    role: "PACIENTE",
    createdAt: {
      gte: inicioMes,
    },
  })

  // Pacientes frecuentes: aquellos con más de 3 turnos completados usando SQL raw
  const pacientesConTurnosRaw = await prisma.$queryRawUnsafe<Array<{
    pacienteId: string
    count: bigint
  }>>(
    `SELECT pacienteId, COUNT(*) as count 
     FROM Turno 
     WHERE estado = 'COMPLETADO' 
     GROUP BY pacienteId`
  )

  const pacientesFrecuentes = pacientesConTurnosRaw.filter(
    (p) => Number(p.count) >= 3
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-[#0F172A] font-inter">
            Pacientes
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Gestione la información clínica y administrativa de los pacientes
          </p>
        </div>
        <Link href="/dashboard/admin/usuarios/nuevo">
          <Button className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium px-6 transition-all duration-200 ease-out hover:scale-[1.02]">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo paciente
          </Button>
        </Link>
      </div>

      {/* Toolbar superior */}
      <PatientFilters
        obrasSociales={obrasSociales}
        profesionales={profesionales}
      />

      {/* Contenido principal: más espacio para el listado */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Tabla de pacientes */}
        <div className="min-w-0">
          <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
            <CardHeader className="border-b border-[#E2E8F0]">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold text-[#0F172A] font-inter">
                    Listado de Pacientes
                  </CardTitle>
                  <p className="text-sm text-[#64748B] mt-1">
                    Total: {pacientesFormateados.length} paciente
                    {pacientesFormateados.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6">
                <PatientTable
                  pacientes={pacientesFormateados as any}
                  basePath="/dashboard/admin/pacientes"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral - Resumen */}
        <div className="shrink-0">
          <PatientSummaryPanel
            totalPacientes={totalPacientes}
            nuevosEsteMes={nuevosEsteMes}
            pacientesFrecuentes={pacientesFrecuentes}
          />
        </div>
      </div>
    </div>
  )
}
