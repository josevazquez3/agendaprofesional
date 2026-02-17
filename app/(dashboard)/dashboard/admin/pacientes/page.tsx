import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
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

  const where: Parameters<typeof prisma.user.findMany>[0]["where"] = { role: "PACIENTE" }
  if (searchParams.search) {
    const term = searchParams.search.trim()
    where.OR = [
      { nombre: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { dni: { contains: term, mode: "insensitive" } },
    ]
  }
  if (searchParams.obraSocialId) {
    where.obraSocialId = searchParams.obraSocialId
  }

  const pacientes = await prisma.user.findMany({
    where,
    orderBy: { nombre: "asc" },
    include: {
      obraSocialRel: { select: { nombre: true } },
      pacienteTurnos: {
        where: { estado: { in: ["COMPLETADO", "CONFIRMADO"] } },
        orderBy: { fecha: "desc" },
        take: 1,
        select: { fecha: true },
      },
    },
  })

  const pacientesFormateados = pacientes.map((paciente) => ({
    id: paciente.id,
    nombre: paciente.nombre,
    dni: paciente.dni,
    email: paciente.email,
    telefono: paciente.telefono,
    obraSocial: paciente.obraSocial,
    obraSocialRel: paciente.obraSocialRel,
    ultimaVisita:
      paciente.pacienteTurnos?.length > 0 ? paciente.pacienteTurnos[0].fecha : null,
  }))

  const obrasSociales = await prisma.obraSocial.findMany({
    where: { activa: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  })

  const profesionales = await prisma.profesional.findMany({
    select: {
      id: true,
      especialidad: true,
      user: { select: { nombre: true } },
    },
  })

  const profesionalesParaFiltro = profesionales
    .filter((p) => p.user)
    .map((p) => ({
      id: p.id,
      user: { nombre: p.user!.nombre },
      especialidad: p.especialidad,
    }))

  const totalPacientes = pacientesFormateados.length

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const nuevosEsteMes = await prisma.user.count({
    where: {
      role: "PACIENTE",
      createdAt: { gte: inicioMes },
    },
  })

  const pacientesFrecuentesAgg = await prisma.turno.groupBy({
    by: ["pacienteId"],
    where: { estado: "COMPLETADO" },
    _count: { id: true },
  })
  const pacientesFrecuentes = pacientesFrecuentesAgg.filter((p) => p._count.id >= 3).length

  return (
    <div className="space-y-6">
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

      <PatientFilters
        obrasSociales={obrasSociales}
        profesionales={profesionalesParaFiltro}
      />

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
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
