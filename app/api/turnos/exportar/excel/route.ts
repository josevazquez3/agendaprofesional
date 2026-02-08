import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import ExcelJS from "exceljs"

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

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Turnos")

    // Definir columnas
    worksheet.columns = [
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Hora", key: "hora", width: 10 },
      { header: "Paciente", key: "paciente", width: 30 },
      { header: "Profesional", key: "profesional", width: 30 },
      { header: "Estado", key: "estado", width: 15 },
      { header: "Causa de Eliminación", key: "motivoEliminacion", width: 50 },
    ]

    // Estilo del encabezado
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    }
    worksheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true }

    // Agregar datos
    turnos.forEach((turno: any) => {
      worksheet.addRow({
        fecha: turno.fecha,
        hora: turno.hora,
        paciente: turno.pacienteNombre || turno.paciente?.nombre || "N/A",
        profesional: turno.profesionalNombre || turno.profesional?.user?.nombre || "N/A",
        estado: turno.estado || "PENDIENTE",
        motivoEliminacion: turno.motivoEliminacion || "",
      })
    })

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="turnos_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error: any) {
    console.error("Error exportando a Excel:", error)
    return NextResponse.json(
      { error: "Error al exportar a Excel" },
      { status: 500 }
    )
  }
}
