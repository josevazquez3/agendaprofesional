"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = "Error al cargar",
  message = "Ocurrió un error al intentar cargar los datos. Por favor, intente nuevamente.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-[#FEE2E2] flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-[#EF4444]" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-[#0F172A] mb-2 font-inter">
        {title}
      </h3>
      <p className="text-sm text-[#64748B] max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="rounded-xl font-medium transition-all duration-200 ease-out"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      )}
    </div>
  )
}
