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
    <div className="space-y-6 -mx-4 sm:-mx-6 lg:-mx-8 px-2 sm:px-4 lg:px-4">
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
        <CardContent className="p-4 sm:p-6">
          {usuarios.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No hay usuarios registrados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-xs sm:text-sm w-[14%]">Nombre</th>
                    <th className="text-left py-2 px-2 text-xs sm:text-sm w-[18%]">Email</th>
                    <th className="text-left py-2 px-2 text-xs sm:text-sm w-[9%]">Rol</th>
                    <th className="text-left py-2 px-2 text-xs sm:text-sm w-[9%]">Estado</th>
                    <th className="text-left py-2 px-2 text-xs sm:text-sm w-[10%]">DNI</th>
                    <th className="text-left py-2 px-2 text-xs sm:text-sm w-[10%]">Teléfono</th>
                    <th className="text-left py-2 px-2 text-xs sm:text-sm w-[10%]">Fecha</th>
                    <th className="text-right py-2 px-2 text-xs sm:text-sm w-[14%]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium text-xs sm:text-sm truncate" title={usuario.nombre}>{usuario.nombre}</td>
                      <td className="py-2 px-2 text-xs sm:text-sm truncate" title={usuario.email}>{usuario.email}</td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium truncate block ${getRoleBadgeColor(
                            usuario.role
                          )}`}
                        >
                          {usuario.role}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium truncate block ${
                            usuario.bloqueado ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {usuario.bloqueado ? "Bloqueado" : "Activo"}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-xs sm:text-sm truncate">{usuario.dni || "-"}</td>
                      <td className="py-2 px-2 text-xs sm:text-sm truncate">{usuario.telefono || "-"}</td>
                      <td className="py-2 px-2 text-xs sm:text-sm">{new Date(usuario.createdAt).toLocaleDateString("es-AR")}</td>
                      <td className="py-2 px-2">
                        <div className="flex justify-end gap-1 flex-nowrap">
                          <Link href={`/dashboard/admin/usuarios/${usuario.id}/editar`}>
                            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <BlockUserButton
                            userId={usuario.id}
                            userName={usuario.nombre}
                            bloqueado={usuario.bloqueado}
                            isCurrentUser={session.user.id === usuario.id}
                            iconOnly
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
