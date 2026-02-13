"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface CancelTurnoButtonProps {
  turnoId: string
}

export function CancelTurnoButton({ turnoId }: CancelTurnoButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirm("¿Estás seguro de cancelar este turno?")) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/turnos/cancelar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ turnoId }),
      })

      if (!response.ok) {
        let errorMessage = "Error al cancelar turno"
        try {
          const data = await response.json()
          errorMessage = data.error || data.details || errorMessage
        } catch {
          const text = await response.text()
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      alert("Turno cancelado exitosamente")
      router.refresh()
    } catch (error: any) {
      console.error("Error cancelando turno:", error)
      alert(error.message || "Error al cancelar turno. Por favor, intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleCancel}
      disabled={loading}
    >
      <X className="h-4 w-4 mr-2" />
      {loading ? "Cancelando..." : "Cancelar"}
    </Button>
  )
}
