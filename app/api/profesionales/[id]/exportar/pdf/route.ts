import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProfesionalById } from "@/lib/profesional-helpers"
import { jsPDF } from "jspdf"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

async function getImageAsBase64(url: string | null | undefined): Promise<string | null> {
  if (!url || typeof url !== "string") return null
  try {
    let finalUrl = url
    if (url.startsWith("/")) {
      const base = process.env.NEXTAUTH_URL || "http://localhost:3000"
      finalUrl = `${base}${url}`
    }
    const res = await fetch(finalUrl, { next: { revalidate: 0 } })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const base64 = Buffer.from(buf).toString("base64")
    const contentType = res.headers.get("content-type") || "image/jpeg"
    return `data:${contentType};base64,${base64}`
  } catch {
    return null
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "ID de profesional requerido" }, { status: 400 })
    }

    const profesional = await getProfesionalById(id, {
      includeUser: true,
      includeUserFields: ["nombre", "email", "telefono", "dni", "fotoPerfil"],
    })
    if (!profesional?.user) {
      return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 })
    }

    const [consultoriosRaw, horariosRaw, arancelesRaw] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ nombre: string; direccion: string }>>(
        `SELECT c.nombre, c.direccion
         FROM ConsultorioProfesional cp
         INNER JOIN Consultorio c ON cp.consultorioId = c.id
         WHERE cp.profesionalId = ?`,
        id
      ),
      prisma.$queryRawUnsafe<Array<{ diaSemana: string; horaInicio: string; horaFin: string }>>(
        `SELECT diaSemana, horaInicio, horaFin FROM HorarioDisponible WHERE profesionalId = ? AND activo = 1`,
        id
      ),
      prisma.$queryRawUnsafe<Array<{ monto: number; descripcion: string | null }>>(
        `SELECT monto, descripcion FROM Arancel WHERE profesionalId = ? AND activo = 1 ORDER BY createdAt DESC LIMIT 1`,
        id
      ),
    ])

    const fotoBase64 = await getImageAsBase64(profesional.user.fotoPerfil)
    const nombre = String(profesional.user.nombre ?? "Profesional")

    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("Datos del Profesional", 14, 20)

    let y = 28
    const lineHeight = 7

    if (fotoBase64) {
      try {
        doc.addImage(fotoBase64, "JPEG", 14, y, 25, 25)
      } catch {
        // si falla el formato, intentar PNG
        try {
          doc.addImage(fotoBase64, "PNG", 14, y, 25, 25)
        } catch {
          // omitir foto
        }
      }
      y += 28
    }

    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Nombre:", 14, y)
    doc.setFont("helvetica", "normal")
    doc.text(nombre, 40, y)
    y += lineHeight

    doc.setFont("helvetica", "bold")
    doc.text("Especialidad:", 14, y)
    doc.setFont("helvetica", "normal")
    doc.text(String(profesional.especialidad ?? "—"), 45, y)
    y += lineHeight

    if (profesional.matricula) {
      doc.setFont("helvetica", "bold")
      doc.text("Matrícula:", 14, y)
      doc.setFont("helvetica", "normal")
      doc.text(profesional.matricula, 40, y)
      y += lineHeight
    }

    doc.setFont("helvetica", "bold")
    doc.text("Email:", 14, y)
    doc.setFont("helvetica", "normal")
    doc.text(String(profesional.user.email ?? "—"), 35, y)
    y += lineHeight

    if (profesional.user.telefono) {
      doc.setFont("helvetica", "bold")
      doc.text("Teléfono:", 14, y)
      doc.setFont("helvetica", "normal")
      doc.text(profesional.user.telefono, 40, y)
      y += lineHeight
    }

    if (profesional.user.dni) {
      doc.setFont("helvetica", "bold")
      doc.text("DNI:", 14, y)
      doc.setFont("helvetica", "normal")
      doc.text(profesional.user.dni, 30, y)
      y += lineHeight
    }

    doc.setFont("helvetica", "bold")
    doc.text("Atiende Obra Social:", 14, y)
    doc.setFont("helvetica", "normal")
    doc.text(profesional.atiendeObraSocial ? "Sí" : "No", 55, y)
    y += lineHeight + 2

    if (arancelesRaw.length > 0) {
      doc.setFont("helvetica", "bold")
      doc.text("Arancel:", 14, y)
      doc.setFont("helvetica", "normal")
      doc.text(
        `$${arancelesRaw[0].monto}${arancelesRaw[0].descripcion ? ` - ${arancelesRaw[0].descripcion}` : ""}`,
        35,
        y
      )
      y += lineHeight + 2
    }

    if (horariosRaw.length > 0) {
      doc.setFont("helvetica", "bold")
      doc.text("Horarios de atención:", 14, y)
      y += lineHeight
      doc.setFont("helvetica", "normal")
      horariosRaw.forEach((h) => {
        doc.text(`${h.diaSemana}: ${h.horaInicio} - ${h.horaFin}`, 20, y)
        y += lineHeight - 1
      })
      y += 2
    }

    if (consultoriosRaw.length > 0) {
      doc.setFont("helvetica", "bold")
      doc.text("Consultorios:", 14, y)
      y += lineHeight
      doc.setFont("helvetica", "normal")
      consultoriosRaw.forEach((c) => {
        doc.text(`${c.nombre} - ${c.direccion}`, 20, y)
        y += lineHeight - 1
      })
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
    const filename = `profesional_${nombre.replace(/\s+/g, "_")}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: unknown) {
    console.error("Error exportando PDF profesional:", error)
    const message = error instanceof Error ? error.message : "Error al exportar PDF"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
