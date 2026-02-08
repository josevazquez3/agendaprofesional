"use client"

import { useState } from "react"
import { AppointmentTable } from "./appointment-table"
import { QuickConsultationDrawer } from "@/components/consultation/quick-consultation-drawer"

interface ProfessionalAppointmentsWrapperProps {
  turnos: any[]
  basePath: string
}

export function ProfessionalAppointmentsWrapper({
  turnos,
  basePath,
}: ProfessionalAppointmentsWrapperProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedTurno, setSelectedTurno] = useState<{
    id: string
    pacienteNombre: string
  } | null>(null)

  const handleQuickConsultation = (turnoId: string, pacienteNombre: string) => {
    setSelectedTurno({ id: turnoId, pacienteNombre })
    setDrawerOpen(true)
  }

  const handleSave = () => {
    // Refrescar datos después de guardar
    window.location.reload()
  }

  return (
    <>
      <AppointmentTable
        turnos={turnos}
        basePath={basePath}
        showQuickConsultation={true}
        onQuickConsultation={handleQuickConsultation}
      />
      {selectedTurno && (
        <QuickConsultationDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          turnoId={selectedTurno.id}
          pacienteNombre={selectedTurno.pacienteNombre}
          onSave={handleSave}
        />
      )}
    </>
  )
}
