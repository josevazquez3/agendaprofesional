import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  const role = session.user.role

  // Redirigir según el rol - usar redirect() de Next.js que maneja correctamente los redirects del servidor
  if (role === "ADMIN") {
    redirect("/dashboard/admin")
  }
  if (role === "SECRETARIA") {
    redirect("/dashboard/secretaria")
  }
  if (role === "PROFESIONAL") {
    redirect("/dashboard/profesional")
  }
  if (role === "PACIENTE") {
    redirect("/dashboard/paciente")
  }

  // Si no coincide ningún rol, redirigir a login
  redirect("/auth/login")
}
