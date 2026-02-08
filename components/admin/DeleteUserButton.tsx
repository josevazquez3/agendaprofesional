"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface DeleteUserButtonProps {
  userId: string
  userName: string
  onDelete?: () => void
}

export function DeleteUserButton({ userId, userName, onDelete }: DeleteUserButtonProps) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${userName}?`)) {
      return
    }

    try {
      const formData = new FormData()
      formData.append("userId", userId)

      const response = await fetch("/api/admin/usuarios/eliminar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al eliminar usuario")
      }

      if (onDelete) {
        onDelete()
      } else {
        router.refresh()
      }
    } catch (error: any) {
      alert(error.message || "Error al eliminar usuario")
    }
  }

  return (
    <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
