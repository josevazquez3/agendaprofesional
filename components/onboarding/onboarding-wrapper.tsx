"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { OnboardingModal } from "./onboarding-modal"

export function OnboardingWrapper() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) return

    // Verificar si el usuario ya completó el onboarding
    const hasCompletedOnboarding = localStorage.getItem(
      `onboarding_completed_${session.user.id}`
    )

    // Solo mostrar para ADMIN y SECRETARIA
    const shouldShow =
      (session.user.role === "ADMIN" || session.user.role === "SECRETARIA") &&
      !hasCompletedOnboarding

    if (shouldShow) {
      // Pequeño delay para mejor UX
      setTimeout(() => {
        setShowOnboarding(true)
      }, 1000)
    }
  }, [session])

  const handleComplete = () => {
    if (session?.user?.id) {
      localStorage.setItem(
        `onboarding_completed_${session.user.id}`,
        "true"
      )
    }
    setShowOnboarding(false)
  }

  if (!session?.user) return null

  return (
    <OnboardingModal
      open={showOnboarding}
      onClose={() => setShowOnboarding(false)}
      onComplete={handleComplete}
      userRole={session.user.role as "ADMIN" | "SECRETARIA" | "PROFESIONAL"}
    />
  )
}
