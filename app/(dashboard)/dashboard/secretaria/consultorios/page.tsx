import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Building, Plus, Edit, Trash2, Users } from "lucide-react"
import { DeleteConsultorioButton } from "@/components/secretaria/DeleteConsultorioButton"

export default async function SecretariaConsultoriosPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== "SECRETARIA" && session.user.role !== "ADMIN")) {
    redirect("/auth/login")
  }

  const consultorios = await prisma.consultorio.findMany({
    include: {
      profesionales: {
        include: {
          profesional: {
            include: {
              user: {
                select: {
                  nombre: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Consultorios</h1>
          <p className="text-gray-600 mt-2">Administra los consultorios del sistema</p>
        </div>
        <Link href="/dashboard/secretaria/consultorios/nuevo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Consultorio
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Consultorios</CardTitle>
          <CardDescription>
            Total de consultorios: {consultorios.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {consultorios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay consultorios registrados
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {consultorios.map((consultorio) => (
                <Card key={consultorio.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      {consultorio.nombre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Dirección:</strong>
                      </p>
                      <p className="text-gray-800">{consultorio.direccion}</p>
                    </div>
                    {consultorio.telefono && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Teléfono:</strong>
                        </p>
                        <p className="text-gray-800">{consultorio.telefono}</p>
                      </div>
                    )}
                    {consultorio.email && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Email:</strong>
                        </p>
                        <p className="text-gray-800">{consultorio.email}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Profesionales:</strong> {consultorio.profesionales.length}
                      </p>
                      {consultorio.profesionales.length > 0 && (
                        <div className="space-y-1">
                          {consultorio.profesionales.map((cp) => (
                            <div
                              key={cp.id}
                              className="text-xs text-gray-600 bg-gray-50 p-2 rounded"
                            >
                              {cp.profesional.user.nombre} - {cp.profesional.especialidad}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4 border-t">
                      <Link
                        href={`/dashboard/secretaria/consultorios/${consultorio.id}/editar`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </Link>
                      <Link
                        href={`/dashboard/secretaria/consultorios/${consultorio.id}/profesionales`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Users className="h-4 w-4 mr-2" />
                          Profesionales
                        </Button>
                      </Link>
                      <DeleteConsultorioButton consultorioId={consultorio.id} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
