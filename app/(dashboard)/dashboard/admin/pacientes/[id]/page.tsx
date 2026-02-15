import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/user-helpers"
import { ArrowLeft, Edit, FileText } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PatientProfileCard } from "@/components/historia-clinica/patient-profile-card"

export default async function FichaPacientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const { id } = await params

  const paciente = await getUserById(id, {
    includeObraSocial: true,
  })

  if (!paciente || paciente.role !== "PACIENTE") {
    notFound()
  }

  // Última visita (último turno completado o confirmado)
  const turnos = await prisma.$queryRawUnsafe<Array<{
    fecha: string
    profesionalId: string
  }>>(
    `SELECT fecha, profesionalId FROM Turno 
     WHERE pacienteId = ? AND estado IN ('CONFIRMADO', 'COMPLETADO')
     ORDER BY fecha DESC LIMIT 1`,
    id
  )

  let profesionalAsignado: { nombre: string; especialidad: string } | null = null
  if (turnos.length > 0) {
    const prof = await prisma.$queryRawUnsafe<Array<{
      userId: string
      especialidad: string
    }>>(
      `SELECT userId, especialidad FROM Profesional WHERE id = ? LIMIT 1`,
      turnos[0].profesionalId
    )
    if (prof.length > 0) {
      const user = await prisma.$queryRawUnsafe<Array<{ nombre: string }>>(
        `SELECT nombre FROM User WHERE id = ? LIMIT 1`,
        prof[0].userId
      )
      if (user.length > 0) {
        profesionalAsignado = {
          nombre: user[0].nombre,
          especialidad: prof[0].especialidad,
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/pacientes">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-[#0F172A] font-inter">
              Ficha del paciente
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Datos personales y acceso rápido
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/admin/usuarios/${id}/editar`}>
            <Button
              variant="outline"
              className="rounded-xl font-medium"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar datos
            </Button>
          </Link>
          <Link href={`/dashboard/admin/historia-clinica/${id}`}>
            <Button className="bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-xl font-medium">
              <FileText className="h-4 w-4 mr-2" />
              Ver historia clínica
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
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
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
            <CardHeader className="border-b border-[#E2E8F0]">
              <CardTitle className="text-lg font-semibold text-[#0F172A] font-inter">
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {paciente.direccion && (
                  <>
                    <dt className="text-[#64748B]">Dirección</dt>
                    <dd className="text-[#0F172A]">{paciente.direccion}</dd>
                  </>
                )}
                <dt className="text-[#64748B]">Obra social</dt>
                <dd className="text-[#0F172A]">
                  {paciente.obraSocialRel?.nombre || paciente.obraSocial || "-"}
                </dd>
                {paciente.fechaNacimiento && (
                  <>
                    <dt className="text-[#64748B]">Fecha de nacimiento</dt>
                    <dd className="text-[#0F172A]">
                      {format(new Date(paciente.fechaNacimiento), "dd/MM/yyyy", {
                        locale: es,
                      })}
                    </dd>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
