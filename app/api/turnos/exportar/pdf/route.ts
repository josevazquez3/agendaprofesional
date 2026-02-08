import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

// Extender el tipo de jsPDF para incluir autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (
      !session ||
      (session.user.role !== "SECRETARIA" && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { turnos } = body

    if (!turnos || !Array.isArray(turnos) || turnos.length === 0) {
      return NextResponse.json(
        { error: "No hay turnos para exportar" },
        { status: 400 }
      )
    }

    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text("Listado de Turnos", 14, 20)

    // Fecha de exportación
    doc.setFontSize(10)
    doc.text(
      `Fecha de exportación: ${new Date().toLocaleDateString("es-AR")}`,
      14,
      30
    )

    // Preparar datos para la tabla
    const tableData = turnos.map((turno: any) => [
      turno.fecha || "N/A",
      turno.hora || "N/A",
      turno.pacienteNombre || turno.paciente?.nombre || "N/A",
      turno.profesionalNombre || turno.profesional?.user?.nombre || "N/A",
      turno.estado || "PENDIENTE",
      turno.motivoEliminacion || "",
    ])

    // Crear tabla
    ;(doc as any).autoTable({
      startY: 35,
      head: [["Fecha", "Hora", "Paciente", "Profesional", "Estado", "Causa de Eliminación"]],
      body: tableData,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [68, 114, 196],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    })

    // Generar buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="turnos_${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("Error exportando a PDF:", error)
    return NextResponse.json(
      { error: "Error al exportar a PDF" },
      { status: 500 }
    )
  }
}
