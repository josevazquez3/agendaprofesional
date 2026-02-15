import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/user-helpers"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

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
    const registroId = searchParams.get("registroId") || null

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

    // Obtener historia clínica (toda o solo un registro si registroId viene)
    const registrosRaw = await prisma.$queryRawUnsafe<Array<{
      id: string
      profesionalId: string
      fechaConsulta: string | number
      notas: string | null
      diagnostico: string | null
      tratamiento: string | null
    }>>(
      registroId
        ? `SELECT id, profesionalId, fechaConsulta, notas, diagnostico, tratamiento 
           FROM HistoriaClinica 
           WHERE pacienteId = ? AND eliminadoAt IS NULL AND id = ?
           ORDER BY fechaConsulta DESC`
        : `SELECT id, profesionalId, fechaConsulta, notas, diagnostico, tratamiento 
           FROM HistoriaClinica 
           WHERE pacienteId = ? AND eliminadoAt IS NULL
           ORDER BY fechaConsulta DESC`,
      ...(registroId ? [pacienteId, registroId] : [pacienteId])
    )

    const profesionalIds = [...new Set(registrosRaw.map((r) => r.profesionalId))]
    let nombresProf: Record<string, { nombre: string; especialidad: string }> = {}
    if (profesionalIds.length > 0) {
      const ph = profesionalIds.map(() => "?").join(",")
      const profs = await prisma.$queryRawUnsafe<Array<{ id: string; userId: string; especialidad: string }>>(
        `SELECT id, userId, especialidad FROM Profesional WHERE id IN (${ph})`,
        ...profesionalIds
      )
      const userIds = profs.map((p) => p.userId)
      const users = await prisma.$queryRawUnsafe<Array<{ id: string; nombre: string }>>(
        `SELECT id, nombre FROM "User" WHERE id IN (${userIds.map(() => "?").join(",")})`,
        ...userIds
      )
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]))
      profs.forEach((p) => {
        nombresProf[p.id] = {
          nombre: userMap[p.userId]?.nombre ?? "—",
          especialidad: p.especialidad ?? "—",
        }
      })
    }

    const ids = registrosRaw.map((r) => r.id)
    let archivosPorRegistro: Record<string, Array<{ nombreArchivo: string; tipoArchivo: string }>> = {}
    if (ids.length > 0) {
      const ph = ids.map(() => "?").join(",")
      const archivos = await prisma.$queryRawUnsafe<Array<{ historiaClinicaId: string; nombreArchivo: string; tipoArchivo: string }>>(
        `SELECT historiaClinicaId, nombreArchivo, tipoArchivo FROM ArchivoHistoriaClinica WHERE historiaClinicaId IN (${ph})`,
        ...ids
      )
      archivos.forEach((a) => {
        if (!archivosPorRegistro[a.historiaClinicaId]) archivosPorRegistro[a.historiaClinicaId] = []
        archivosPorRegistro[a.historiaClinicaId].push({ nombreArchivo: a.nombreArchivo, tipoArchivo: a.tipoArchivo })
      })
    }

    const historiaClinica = registrosRaw.map((r) => ({
      id: r.id,
      fechaConsulta: r.fechaConsulta,
      notas: r.notas,
      diagnostico: r.diagnostico,
      tratamiento: r.tratamiento,
      profesional: nombresProf[r.profesionalId] ? { user: { nombre: nombresProf[r.profesionalId].nombre }, especialidad: nombresProf[r.profesionalId].especialidad } : null,
      archivos: archivosPorRegistro[r.id] ?? [],
    }))

    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text("Historia Clínica", 14, 20)

    // Datos del paciente
    doc.setFontSize(12)
    const nombrePac = String(paciente.nombre ?? "")
    const emailPac = String(paciente.email ?? "")
    doc.text(`Paciente: ${nombrePac}`, 14, 35)
    if (paciente.dni) {
      doc.text(`DNI: ${paciente.dni}`, 14, 42)
    }
    doc.text(`Email: ${emailPac}`, 14, 49)
    if (paciente.fechaNacimiento) {
      try {
        const f = new Date(paciente.fechaNacimiento as Date)
        if (!isNaN(f.getTime())) {
          doc.text(`Fecha de Nacimiento: ${f.toLocaleDateString("es-AR")}`, 14, 56)
        }
      } catch {
        // ignorar fecha inválida
      }
    }

    // Tabla de registros (todos los valores como string para jsPDF)
    const toDate = (v: string | number | Date) => (v instanceof Date ? v : new Date(v as string | number))
    const tableData = historiaClinica.map((registro) => [
      toDate(registro.fechaConsulta).toLocaleDateString("es-AR"),
      String(registro.profesional?.user?.nombre || "Profesional no disponible"),
      String(registro.profesional?.especialidad || "N/A"),
      String(registro.diagnostico ?? "N/A"),
      String(registro.tratamiento ?? "N/A"),
    ])

    autoTable(doc, {
      startY: 65,
      head: [["Fecha", "Profesional", "Especialidad", "Diagnóstico", "Tratamiento"]],
      body: tableData.length > 0 ? tableData : [["Sin registros", "-", "-", "-", "-"]],
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
    const lastTable = (doc as any).lastAutoTable
    let yPos = (lastTable?.finalY ?? 65) + 10

    historiaClinica.forEach((registro, index) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text(
        `Registro ${index + 1} - ${toDate(registro.fechaConsulta).toLocaleDateString("es-AR")}`,
        14,
        yPos
      )
      yPos += 7

      doc.setFont("helvetica", "normal")
      if (registro.notas) {
        doc.setFontSize(9)
        const textoNotas = String(registro.notas).slice(0, 2000)
        const notasLines = doc.splitTextToSize(`Observaciones: ${textoNotas}`, 180)
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
    const soloUnRegistro = historiaClinica.length === 1 && historiaClinica[0]?.profesional
    const nombreArchivo = soloUnRegistro
      ? `historia_clinica_${nombrePac.replace(/\s/g, "_")}_${String(historiaClinica[0].profesional?.user?.nombre ?? "registro").replace(/\s/g, "_")}.pdf`
      : `historia_clinica_${nombrePac.replace(/\s/g, "_")}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    })
  } catch (error: any) {
    console.error("Error exportando PDF:", error)
    const message = error?.message || "Error al exportar PDF"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
