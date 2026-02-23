"use client"

import { Button } from "@/components/ui/button"
import { Ban, Unlock } from "lucide-react"
import { useRouter } from "next/navigation"

interface BlockUserButtonProps {
  userId: string
  userName: string
  bloqueado: boolean
  isCurrentUser?: boolean
  iconOnly?: boolean
}

export function BlockUserButton({
  userId,
  userName,
  bloqueado,
  isCurrentUser = false,
  iconOnly = false,
}: BlockUserButtonProps) {
  const router = useRouter()

  if (isCurrentUser) return null

  const handleToggle = async () => {
    const action = bloqueado ? "desbloquear" : "bloquear"
    if (!confirm(`¿Estás seguro de ${action} al usuario ${userName}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/usuarios/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bloqueado: !bloqueado }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Error al ${action} usuario`)
      }

      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : `Error al ${action}`)
    }
  }

  return (
    <Button
      type="button"
      variant={bloqueado ? "default" : "outline"}
      size={iconOnly ? "icon" : "sm"}
      className={iconOnly ? "h-8 w-8 shrink-0" : undefined}
      onClick={handleToggle}
      title={bloqueado ? "Desbloquear usuario" : "Bloquear usuario"}
    >
      {bloqueado ? (
        <>
          <Unlock className="h-4 w-4" />
          {!iconOnly && "Desbloquear"}
        </>
      ) : (
        <>
          <Ban className="h-4 w-4" />
          {!iconOnly && "Bloquear"}
        </>
      )}
    </Button>
  )
}
