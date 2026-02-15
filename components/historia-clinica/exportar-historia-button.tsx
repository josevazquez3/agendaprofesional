"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, FileDown } from "lucide-react"

interface ExportarHistoriaButtonProps {
  pacienteId: string
  pacienteNombre: string
}

export function ExportarHistoriaButton({
  pacienteId,
  pacienteNombre,
}: ExportarHistoriaButtonProps) {
  const [exportando, setExportando] = useState<"pdf" | "docx" | null>(null)

  const descargar = async (formato: "pdf" | "docx") => {
    setExportando(formato)
    try {
      const url =
        formato === "pdf"
          ? `/api/historia-clinica/exportar/pdf?pacienteId=${pacienteId}`
          : `/api/historia-clinica/exportar/doc?pacienteId=${pacienteId}`
      const response = await fetch(url)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Error ${response.status} al exportar`)
      }
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `historia_clinica_${pacienteNombre || pacienteId}.${formato === "pdf" ? "pdf" : "docx"}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (e: any) {
      alert(e.message || "Error al exportar")
    } finally {
      setExportando(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl font-medium px-6 transition-all duration-200 ease-out hover:scale-[1.02]"
          disabled={exportando !== null}
        >
          <Download className="h-4 w-4 mr-2" />
          {exportando ? `Exportando ${exportando.toUpperCase()}...` : "Exportar"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => descargar("pdf")}>
          <FileText className="h-4 w-4 mr-2" />
          Descargar PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => descargar("docx")}>
          <FileDown className="h-4 w-4 mr-2" />
          Descargar DOCX
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
