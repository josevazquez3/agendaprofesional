"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface DeleteConsultorioButtonProps {
  consultorioId: string
}

export function DeleteConsultorioButton({
  consultorioId,
}: DeleteConsultorioButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar este consultorio?")) {
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("consultorioId", consultorioId)

      const response = await fetch("/api/consultorios/eliminar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al eliminar consultorio")
      }

      router.refresh()
    } catch (error: any) {
      alert(error.message || "Error al eliminar consultorio")
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
