"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Dashboard error]", error?.message, error?.digest)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-amber-500" strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-[#0F172A]">
            Algo salió mal
          </h1>
          <p className="text-sm text-[#64748B]">
            No pudimos cargar el panel. Prueba de nuevo o cierra sesión e inicia sesión otra vez.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] transition-colors"
          >
            Reintentar
          </button>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[#E2E8F0] text-[#0F172A] text-sm font-medium hover:bg-[#F8FAFC] transition-colors"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
