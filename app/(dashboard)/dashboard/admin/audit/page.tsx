import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getActiveClinic } from "@/lib/clinic-context"
import { prisma } from "@/lib/prisma"
import { AuditPageClient } from "./audit-page-client"

export default async function AuditPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Solo ADMIN y OWNER pueden ver auditorías
  if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
    redirect("/dashboard")
  }

  const clinic = await getActiveClinic()
  if (!clinic) {
    redirect("/dashboard")
  }

  // Obtener usuarios de la clínica para el filtro usando SQL raw
  // Nota: clinicId no existe en la tabla User directamente, se obtiene vía ClinicUser
  const clinicUsers = await prisma.$queryRawUnsafe<Array<{
    userId: string
  }>>(
    `SELECT userId FROM ClinicUser WHERE clinicId = ? AND activo = 1`,
    clinic.id
  )

  const userIds = clinicUsers.map((cu) => cu.userId)
  let users: Array<{
    id: string
    nombre: string
    email: string
    role: string
  }> = []

  if (userIds.length > 0) {
    const placeholders = userIds.map(() => "?").join(",")
    users = await prisma.$queryRawUnsafe<Array<{
      id: string
      nombre: string
      email: string
      role: string
    }>>(
      `SELECT id, nombre, email, role FROM User WHERE id IN (${placeholders}) ORDER BY nombre ASC`,
      ...userIds
    )
  }

  // Obtener logs iniciales (últimos 50)
  const initialLogs = await prisma.auditLog.findMany({
    where: { clinicId: clinic.id },
    include: {
      user: {
        select: {
          id: true,
          nombre: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  })

  const total = await prisma.auditLog.count({
    where: { clinicId: clinic.id },
  })

  return (
    <AuditPageClient
      initialLogs={initialLogs}
      users={users}
      initialTotal={total}
      clinicId={clinic.id}
    />
  )
}
