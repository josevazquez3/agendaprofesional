"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CompletarTurnoModal } from "./CompletarTurnoModal"

interface CompletarTurnoButtonProps {
  turnoId: string
  pacienteNombre?: string
}

export function CompletarTurnoButton({
  turnoId,
  pacienteNombre = "Paciente",
}: CompletarTurnoButtonProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => setShowModal(true)}
      >
        Completar Turno
      </Button>
      {showModal && (
        <CompletarTurnoModal
          turnoId={turnoId}
          pacienteNombre={pacienteNombre}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
