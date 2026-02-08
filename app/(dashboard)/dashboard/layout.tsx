import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardLayout as DashboardLayoutComponent } from "@/components/dashboard/dashboard-layout"
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider"
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider"
import { ShortcutProvider } from "@/components/shortcuts/shortcut-provider"
import { PrefetchProvider } from "@/components/performance/prefetch-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <CommandPaletteProvider>
      <ShortcutProvider>
        <OnboardingProvider>
          <PrefetchProvider>
            <DashboardLayoutComponent user={session.user}>
              {children}
            </DashboardLayoutComponent>
          </PrefetchProvider>
        </OnboardingProvider>
      </ShortcutProvider>
    </CommandPaletteProvider>
  )
}
