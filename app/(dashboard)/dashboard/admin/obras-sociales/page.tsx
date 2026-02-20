import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Heart, Plus, Edit, CheckCircle, XCircle } from "lucide-react"
import { DeleteObraSocialButton } from "@/components/admin/DeleteObraSocialButton"

export default async function AdminObrasSocialesPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SECRETARIA")) {
    redirect("/auth/login")
  }

  const obrasSociales = await prisma.obraSocial.findMany({
    orderBy: { nombre: "asc" },
    include: {
      _count: {
        select: { pacientes: true, turnos: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Obras Sociales"
        subtitle="Administra las obras sociales del sistema"
        action={
          session.user.role === "ADMIN" ? (
            <Link href="/dashboard/admin/obras-sociales/nuevo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Obra Social
              </Button>
            </Link>
          ) : undefined
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Listado de Obras Sociales</CardTitle>
          <CardDescription>
            Total de obras sociales: {obrasSociales.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {obrasSociales.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No hay obras sociales registradas
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {obrasSociales.map((obraSocial) => (
                <Card key={obraSocial.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Heart className="h-5 w-5 mr-2 text-red-500" />
                        {obraSocial.nombre}
                      </div>
                      {obraSocial.activa ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {obraSocial.codigo && (
                      <div>
                        <p className="text-sm text-slate-600 mb-1"><strong>Código:</strong></p>
                        <p className="text-slate-800">{obraSocial.codigo}</p>
                      </div>
                    )}
                    {obraSocial.descripcion && (
                      <div>
                        <p className="text-sm text-slate-600 mb-1"><strong>Descripción:</strong></p>
                        <p className="text-slate-800">{obraSocial.descripcion}</p>
                      </div>
                    )}
                    {obraSocial.telefono && (
                      <div>
                        <p className="text-sm text-slate-600 mb-1"><strong>Teléfono:</strong></p>
                        <p className="text-slate-800">{obraSocial.telefono}</p>
                      </div>
                    )}
                    {obraSocial.email && (
                      <div>
                        <p className="text-sm text-slate-600 mb-1"><strong>Email:</strong></p>
                        <p className="text-slate-800">{obraSocial.email}</p>
                      </div>
                    )}
                    {obraSocial.direccion && (
                      <div>
                        <p className="text-sm text-slate-600 mb-1"><strong>Dirección:</strong></p>
                        <p className="text-slate-800">{obraSocial.direccion}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <div className="text-sm text-slate-600">
                        <strong>Pacientes:</strong> {obraSocial._count.pacientes}
                      </div>
                      <div className="text-sm text-slate-600">
                        <strong>Turnos:</strong> {obraSocial._count.turnos}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          obraSocial.activa ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {obraSocial.activa ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    {session.user.role === "ADMIN" && (
                      <div className="flex gap-2 pt-4 border-t">
                        <Link href={`/dashboard/admin/obras-sociales/${obraSocial.id}/editar`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </Link>
                        <DeleteObraSocialButton obraSocialId={obraSocial.id} />
                      </div>
                    )}
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
