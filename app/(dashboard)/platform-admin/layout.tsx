import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Solo PLATFORM_OWNER puede acceder
  if (session.user.role !== "PLATFORM_OWNER") {
    redirect("/dashboard")
  }

  return <>{children}</>
}
