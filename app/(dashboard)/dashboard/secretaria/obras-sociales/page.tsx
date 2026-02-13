import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { getObrasSociales } from "@/lib/obra-social-helpers"
import { Heart, CheckCircle, XCircle } from "lucide-react"

export default async function SecretariaObrasSocialesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "SECRETARIA") {
    redirect("/auth/login")
  }

  const obrasSociales = await getObrasSociales({
    includeCounts: true,
    orderBy: { nombre: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Obras Sociales</h1>
          <p className="text-gray-600 mt-2">Consulta las obras sociales del sistema</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Obras Sociales</CardTitle>
          <CardDescription>
            Total de obras sociales: {obrasSociales.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {obrasSociales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
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
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Código:</strong>
                        </p>
                        <p className="text-gray-800">{obraSocial.codigo}</p>
                      </div>
                    )}
                    {obraSocial.descripcion && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Descripción:</strong>
                        </p>
                        <p className="text-gray-800">{obraSocial.descripcion}</p>
                      </div>
                    )}
                    {obraSocial.telefono && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Teléfono:</strong>
                        </p>
                        <p className="text-gray-800">{obraSocial.telefono}</p>
                      </div>
                    )}
                    {obraSocial.email && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Email:</strong>
                        </p>
                        <p className="text-gray-800">{obraSocial.email}</p>
                      </div>
                    )}
                    {obraSocial.direccion && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Dirección:</strong>
                        </p>
                        <p className="text-gray-800">{obraSocial.direccion}</p>
                      </div>
                    )}
                    {obraSocial._count && (
                      <div className="flex items-center gap-4 pt-2 border-t">
                        <div className="text-sm text-gray-600">
                          <strong>Pacientes:</strong> {obraSocial._count.pacientes}
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Turnos:</strong> {obraSocial._count.turnos}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          obraSocial.activa
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {obraSocial.activa ? "Activa" : "Inactiva"}
                      </span>
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
