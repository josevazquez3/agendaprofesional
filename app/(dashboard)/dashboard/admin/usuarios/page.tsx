import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Edit } from "lucide-react"
import { DeleteUserButton } from "@/components/admin/DeleteUserButton"

export default async function AdminUsuariosPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const usuariosRaw = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      profesional: {
        select: { id: true, especialidad: true },
      },
    },
  })

  const usuarios = usuariosRaw.map((usuario) => ({
    ...usuario,
    profesional: usuario.profesional
      ? {
          id: usuario.profesional.id,
          especialidad: usuario.profesional.especialidad,
          user: {
            nombre: usuario.nombre,
            email: usuario.email,
          },
        }
      : null,
  }))

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800"
      case "SECRETARIA":
        return "bg-blue-100 text-blue-800"
      case "PROFESIONAL":
        return "bg-green-100 text-green-800"
      case "PACIENTE":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-2">Administra todos los usuarios del sistema</p>
        </div>
        <Link href="/dashboard/admin/usuarios/nuevo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Usuarios</CardTitle>
          <CardDescription>
            Total de usuarios: {usuarios.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usuarios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay usuarios registrados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Nombre</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Rol</th>
                    <th className="text-left p-4">DNI</th>
                    <th className="text-left p-4">Teléfono</th>
                    <th className="text-left p-4">Fecha Registro</th>
                    <th className="text-right p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{usuario.nombre}</td>
                      <td className="p-4">{usuario.email}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            usuario.role
                          )}`}
                        >
                          {usuario.role}
                        </span>
                      </td>
                      <td className="p-4">{usuario.dni || "-"}</td>
                      <td className="p-4">{usuario.telefono || "-"}</td>
                      <td className="p-4">
                        {new Date(usuario.createdAt).toLocaleDateString("es-AR")}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/admin/usuarios/${usuario.id}/editar`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <DeleteUserButton userId={usuario.id} userName={usuario.nombre} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
