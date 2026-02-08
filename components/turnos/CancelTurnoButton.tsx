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
      const formData = new FormData()
      formData.append("turnoId", turnoId)

      const response = await fetch("/api/turnos/cancelar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al cancelar turno")
      }

      router.refresh()
    } catch (error: any) {
      alert(error.message || "Error al cancelar turno")
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
