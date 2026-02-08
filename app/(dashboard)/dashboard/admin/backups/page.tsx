import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getActiveClinic } from "@/lib/clinic-context"
import { prisma } from "@/lib/prisma"
import { BackupsPageClient } from "./backups-page-client"

export default async function BackupsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "PLATFORM_OWNER") {
    redirect("/dashboard")
  }

  const clinic = await getActiveClinic()
  if (!clinic) {
    redirect("/dashboard")
  }

  // Obtener backup jobs y logs
  const jobs = await prisma.backupJob.findMany({
    where: { clinicId: clinic.id },
    include: {
      logs: {
        orderBy: {
          executedAt: "desc",
        },
        take: 20, // Últimos 20 logs
      },
      _count: {
        select: {
          logs: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return <BackupsPageClient initialJobs={jobs} clinicId={clinic.id} />
}
