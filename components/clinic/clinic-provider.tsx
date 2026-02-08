"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { ClinicBranding } from "./clinic-branding"

interface ClinicContextType {
  clinic: {
    id: string
    nombre: string
    slug: string
    logo?: string | null
    colorPrimary?: string | null
  } | null
  loading: boolean
}

const ClinicContext = createContext<ClinicContextType>({
  clinic: null,
  loading: true,
})

export function useClinic() {
  return useContext(ClinicContext)
}

interface ClinicProviderProps {
  children: React.ReactNode
  clinic: {
    id: string
    nombre: string
    slug: string
    logo?: string | null
    colorPrimary?: string | null
  } | null
}

export function ClinicProvider({ children, clinic }: ClinicProviderProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [clinic])

  return (
    <ClinicContext.Provider value={{ clinic, loading }}>
      {clinic && (
        <ClinicBranding
          colorPrimary={clinic.colorPrimary}
          logo={clinic.logo}
          nombre={clinic.nombre}
        />
      )}
      {children}
    </ClinicContext.Provider>
  )
}
