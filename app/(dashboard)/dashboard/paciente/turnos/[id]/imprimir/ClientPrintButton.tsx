"use client"

import { Button } from "@/components/ui/button"

export function ClientPrintButton() {
  return (
    <Button
      onClick={() => window.print()}
      className="print:hidden"
    >
      Imprimir
    </Button>
  )
}
