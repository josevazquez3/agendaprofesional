import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardLayout as DashboardLayoutComponent } from "@/components/dashboard/dashboard-layout"
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider"
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider"
import { ShortcutProvider } from "@/components/shortcuts/shortcut-provider"
import { PrefetchProvider } from "@/components/performance/prefetch-provider"

// Evita que Vercel intente pre-renderizar estas rutas (usan getServerSession/headers)
export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session
  try {
    session = await getServerSession(authOptions)
  } catch (err) {
    console.error("[Dashboard layout] getServerSession error:", err)
    redirect("/auth/login")
  }

  if (!session?.user) {
    redirect("/auth/login")
  }

  const user = session.user
  const safeUser = {
    ...user,
    role: user.role ?? "PACIENTE",
    id: user.id ?? "",
    name: user.name ?? "",
    email: user.email ?? "",
  }

  return (
    <CommandPaletteProvider>
      <ShortcutProvider>
        <OnboardingProvider>
          <PrefetchProvider>
            <DashboardLayoutComponent user={safeUser}>
              {children}
            </DashboardLayoutComponent>
          </PrefetchProvider>
        </OnboardingProvider>
      </ShortcutProvider>
    </CommandPaletteProvider>
  )
}
