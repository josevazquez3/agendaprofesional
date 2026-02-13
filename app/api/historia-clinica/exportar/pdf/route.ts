import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/user-helpers"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (
      !session ||
      (session.user.role !== "ADMIN" &&
        session.user.role !== "SECRETARIA" &&
        session.user.role !== "PROFESIONAL")
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pacienteId = searchParams.get("pacienteId")

    if (!pacienteId) {
      return NextResponse.json(
        { error: "pacienteId es requerido" },
        { status: 400 }
      )
    }

    // Obtener paciente usando helper
    const paciente = await getUserById(pacienteId)

    if (!paciente) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      )
    }

    // Obtener historia clínica
    const historiaClinica = await prisma.historiaClinica.findMany({
      where: { pacienteId },
      include: {
        profesional: {
          include: {
            user: true,
          },
        },
        turno: {
          select: {
            fecha: true,
            hora: true,
          },
        },
        archivos: true,
      },
      orderBy: {
        fechaConsulta: "desc",
      },
    })

    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text("Historia Clínica", 14, 20)

    // Datos del paciente
    doc.setFontSize(12)
    doc.text(`Paciente: ${paciente.nombre}`, 14, 35)
    if (paciente.dni) {
      doc.text(`DNI: ${paciente.dni}`, 14, 42)
    }
    doc.text(`Email: ${paciente.email}`, 14, 49)
    if (paciente.fechaNacimiento) {
      doc.text(
        `Fecha de Nacimiento: ${new Date(paciente.fechaNacimiento).toLocaleDateString("es-AR")}`,
        14,
        56
      )
    }

    // Tabla de registros
    const tableData = historiaClinica.map((registro) => [
      new Date(registro.fechaConsulta).toLocaleDateString("es-AR"),
      registro.profesional?.user?.nombre || "Profesional no disponible",
      registro.profesional?.especialidad || "N/A",
      registro.diagnostico || "N/A",
      registro.tratamiento || "N/A",
    ])

    ;(doc as any).autoTable({
      startY: 65,
      head: [["Fecha", "Profesional", "Especialidad", "Diagnóstico", "Tratamiento"]],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [68, 114, 196],
        textColor: 255,
        fontStyle: "bold",
      },
    })

    // Agregar observaciones y estudios en páginas adicionales
    let yPos = (doc as any).lastAutoTable.finalY + 10

    historiaClinica.forEach((registro, index) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(10)
      doc.setFont(undefined, "bold")
      doc.text(
        `Registro ${index + 1} - ${new Date(registro.fechaConsulta).toLocaleDateString("es-AR")}`,
        14,
        yPos
      )
      yPos += 7

      doc.setFont(undefined, "normal")
      if (registro.notas) {
        doc.setFontSize(9)
        const notasLines = doc.splitTextToSize(`Observaciones: ${registro.notas}`, 180)
        doc.text(notasLines, 14, yPos)
        yPos += notasLines.length * 5 + 3
      }

      if (registro.archivos.length > 0) {
        doc.setFontSize(9)
        doc.text("Estudios:", 14, yPos)
        yPos += 5
        registro.archivos.forEach((archivo) => {
          doc.text(`- ${archivo.nombreArchivo} (${archivo.tipoArchivo})`, 20, yPos)
          yPos += 5
        })
      }

      yPos += 5
    })

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="historia_clinica_${paciente.nombre.replace(/\s/g, "_")}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("Error exportando PDF:", error)
    return NextResponse.json(
      { error: "Error al exportar PDF" },
      { status: 500 }
    )
  }
}
