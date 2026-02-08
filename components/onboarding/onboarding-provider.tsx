"use client"

import { OnboardingWrapper } from "./onboarding-wrapper"

interface OnboardingProviderProps {
  children: React.ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  return (
    <>
      {children}
      <OnboardingWrapper />
    </>
  )
}
