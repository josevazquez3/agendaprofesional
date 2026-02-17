import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { User, Building } from "lucide-react"
import Image from "next/image"

export default async function SecretariaProfesionalesPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== "SECRETARIA" && session.user.role !== "ADMIN")) {
    redirect("/auth/login")
  }

  const profesionales = await prisma.profesional.findMany({
    include: {
      user: {
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          dni: true,
          fotoPerfil: true,
        },
      },
      consultorios: {
        include: {
          consultorio: { select: { nombre: true, direccion: true } },
        },
      },
      horarios: { where: { activo: true } },
      aranceles: {
        where: { activo: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const profesionalesFormateados = profesionales.map((prof) => ({
    ...prof,
    user: prof.user!,
    consultorios: prof.consultorios.map((cp) => ({
      id: cp.id,
      consultorio: {
        nombre: cp.consultorio.nombre,
        direccion: cp.consultorio.direccion,
      },
    })),
    horarios: prof.horarios,
    aranceles: prof.aranceles,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profesionales</h1>
        <p className="text-gray-600 mt-2">
          Listado de profesionales médicos del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Profesionales</CardTitle>
          <CardDescription>
            Total de profesionales: {profesionalesFormateados.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profesionalesFormateados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay profesionales registrados
            </div>
          ) : (
            <div className="space-y-4">
              {profesionalesFormateados.map((profesional) => (
                <Card key={profesional.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {profesional.user.fotoPerfil ? (
                        <div className="relative w-16 h-16">
                          <Image
                            src={profesional.user.fotoPerfil}
                            alt={profesional.user.nombre}
                            fill
                            className="rounded-full object-cover border-2 border-gray-300"
                          />
                        </div>
                      ) : (
                        <div className="p-3 bg-green-100 rounded-full">
                          <User className="h-6 w-6 text-green-800" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{profesional.user.nombre}</h3>
                        <p className="text-gray-600">{profesional.especialidad}</p>
                        {profesional.matricula && (
                          <p className="text-sm text-gray-500">Matrícula: {profesional.matricula}</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1"><strong>Email:</strong></p>
                            <p className="text-gray-800">{profesional.user.email}</p>
                          </div>
                          {profesional.user.telefono && (
                            <div>
                              <p className="text-sm text-gray-600 mb-1"><strong>Teléfono:</strong></p>
                              <p className="text-gray-800">{profesional.user.telefono}</p>
                            </div>
                          )}
                          {profesional.user.dni && (
                            <div>
                              <p className="text-sm text-gray-600 mb-1"><strong>DNI:</strong></p>
                              <p className="text-gray-800">{profesional.user.dni}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-gray-600 mb-1"><strong>Atiende Obra Social:</strong></p>
                            <p className="text-gray-800">
                              {profesional.atiendeObraSocial ? "Sí" : "No"}
                            </p>
                          </div>
                        </div>

                        {profesional.aranceles.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-1"><strong>Arancel:</strong></p>
                            <p className="text-gray-800">
                              ${profesional.aranceles[0].monto}
                              {profesional.aranceles[0].descripcion &&
                                ` - ${profesional.aranceles[0].descripcion}`}
                            </p>
                          </div>
                        )}

                        {profesional.horarios.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2"><strong>Horarios de Atención:</strong></p>
                            <div className="flex flex-wrap gap-2">
                              {profesional.horarios.map((horario) => (
                                <span
                                  key={horario.id}
                                  className="px-2 py-1 bg-blue-50 text-blue-800 rounded text-xs"
                                >
                                  {horario.diaSemana}: {horario.horaInicio} - {horario.horaFin}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {profesional.consultorios.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2"><strong>Consultorios:</strong></p>
                            <div className="flex flex-wrap gap-2">
                              {profesional.consultorios.map((cp) => (
                                <span
                                  key={cp.id}
                                  className="px-2 py-1 bg-purple-50 text-purple-800 rounded text-xs flex items-center gap-1"
                                >
                                  <Building className="h-3 w-3" />
                                  {cp.consultorio.nombre} - {cp.consultorio.direccion}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
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
