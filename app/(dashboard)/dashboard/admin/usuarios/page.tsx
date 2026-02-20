import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Edit } from "lucide-react"
import { DeleteUserButton } from "@/components/admin/DeleteUserButton"
import { BlockUserButton } from "@/components/admin/BlockUserButton"

export default async function AdminUsuariosPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const usuariosRaw = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nombre: true,
      email: true,
      dni: true,
      telefono: true,
      role: true,
      bloqueado: true,
      createdAt: true,
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
  })) as Array<{
    id: string
    nombre: string
    email: string
    dni: string | null
    telefono: string | null
    role: string
    bloqueado: boolean
    createdAt: Date
    profesional: { id: string; especialidad: string; user: { nombre: string; email: string } } | null
  }>

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800"
      case "SECRETARIA":
        return "bg-blue-100 text-blue-800"
      case "PROFESIONAL":
        return "bg-green-100 text-green-800"
      case "PACIENTE":
        return "bg-gray-100 text-slate-800"
      default:
        return "bg-gray-100 text-slate-800"
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Usuarios"
        subtitle="Administra todos los usuarios del sistema"
        action={
          <Link href="/dashboard/admin/usuarios/nuevo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Listado de Usuarios</CardTitle>
          <CardDescription>
            Total de usuarios: {usuarios.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usuarios.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
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
                    <th className="text-left p-4">Estado</th>
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
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            usuario.bloqueado ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {usuario.bloqueado ? "Bloqueado" : "Activo"}
                        </span>
                      </td>
                      <td className="p-4">{usuario.dni || "-"}</td>
                      <td className="p-4">{usuario.telefono || "-"}</td>
                      <td className="p-4">
                        {new Date(usuario.createdAt).toLocaleDateString("es-AR")}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Link href={`/dashboard/admin/usuarios/${usuario.id}/editar`}>
                            <Button variant="outline" size="sm" title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <BlockUserButton
                            userId={usuario.id}
                            userName={usuario.nombre}
                            bloqueado={usuario.bloqueado}
                            isCurrentUser={session.user.id === usuario.id}
                          />
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
