import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { formatDate, formatDateTime } from "@/lib/utils"
import { FileText, Download } from "lucide-react"
import Link from "next/link"

export default async function HistoriaClinicaPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "PACIENTE") {
    redirect("/auth/login")
  }

  const historiaClinica = await prisma.historiaClinica.findMany({
    where: {
      pacienteId: session.user.id,
    },
    include: {
      profesional: {
        include: {
          user: true,
        },
      },
      archivos: true,
      turno: true,
    },
    orderBy: {
      fechaConsulta: "desc",
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mi Historia Clínica</h1>

      <Card>
        <CardHeader>
          <CardTitle>Registros Médicos</CardTitle>
        </CardHeader>
        <CardContent>
          {historiaClinica.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay registros médicos disponibles
            </div>
          ) : (
            <div className="space-y-6">
              {historiaClinica.map((registro) => (
                <div
                  key={registro.id}
                  className="border rounded-lg p-6 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {registro.profesional.user.nombre}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {registro.profesional.especialidad}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {formatDateTime(registro.fechaConsulta, "")}
                      </p>
                      {registro.turno && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-500">
                            Turno:{" "}
                            {formatDate(registro.turno.fecha)} - {registro.turno.hora}
                          </p>
                          {registro.turno.estado === "ELIMINADO" && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                              <p className="text-sm font-semibold text-red-800 mb-1">
                                ⚠️ Turno Eliminado
                              </p>
                              {registro.turno.motivoEliminacion && (
                                <p className="text-sm text-red-700">
                                  <strong>Causa de eliminación:</strong> {registro.turno.motivoEliminacion}
                                </p>
                              )}
                              {registro.turno.eliminadoAt && (
                                <p className="text-xs text-red-600 mt-1">
                                  Fecha de eliminación: {formatDate(registro.turno.eliminadoAt)} {new Date(registro.turno.eliminadoAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {registro.turno && registro.turno.estado !== "ELIMINADO" && (
                      <Link
                        href={`/dashboard/paciente/turnos/${registro.turno.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Ver Turno
                      </Link>
                    )}
                  </div>

                  {registro.diagnostico && (
                    <div>
                      <h4 className="font-semibold mb-2">Diagnóstico</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {registro.diagnostico}
                      </p>
                    </div>
                  )}

                  {registro.tratamiento && (
                    <div>
                      <h4 className="font-semibold mb-2">Tratamiento</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {registro.tratamiento}
                      </p>
                    </div>
                  )}

                  {registro.notas && (
                    <div>
                      <h4 className="font-semibold mb-2">Notas</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {registro.notas}
                      </p>
                    </div>
                  )}

                  {registro.archivos.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Archivos Adjuntos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {registro.archivos.map((archivo) => (
                          <a
                            key={archivo.id}
                            href={archivo.urlArchivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{archivo.nombreArchivo}</span>
                            <Download className="h-4 w-4 ml-auto" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    <Link
                      href={`/dashboard/paciente/historia-clinica/${registro.id}/exportar?formato=pdf`}
                      className="text-sm text-primary hover:underline"
                    >
                      Exportar PDF
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link
                      href={`/dashboard/paciente/historia-clinica/${registro.id}/exportar?formato=doc`}
                      className="text-sm text-primary hover:underline"
                    >
                      Exportar DOC
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
