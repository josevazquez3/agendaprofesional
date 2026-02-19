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

  const clinicUsers = await prisma.clinicUser.findMany({
    where: { clinicId: clinic.id, activo: true },
    select: { userId: true },
  })
  const userIds = clinicUsers.map((cu) => cu.userId)
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          orderBy: { nombre: "asc" },
          select: { id: true, nombre: true, email: true, role: true },
        })
      : []

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
