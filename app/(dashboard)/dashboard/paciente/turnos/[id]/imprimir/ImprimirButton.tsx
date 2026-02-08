"use client"

import { Button } from "@/components/ui/button"

export function ImprimirButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Button onClick={handlePrint} className="print:hidden">
      Imprimir
    </Button>
  )
}
