"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface DeleteObraSocialButtonProps {
  obraSocialId: string
}

export function DeleteObraSocialButton({
  obraSocialId,
}: DeleteObraSocialButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar esta obra social?")) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/obras-sociales/${obraSocialId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al eliminar obra social")
      }

      router.refresh()
    } catch (error: any) {
      alert(error.message || "Error al eliminar obra social")
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
