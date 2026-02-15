import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProfesionalById } from "@/lib/profesional-helpers"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ImageRun,
} from "docx"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

async function getImageBuffer(url: string | null | undefined): Promise<{ buffer: Buffer; type: "png" | "jpeg" } | null> {
  if (!url || typeof url !== "string") return null
  try {
    let finalUrl = url
    if (url.startsWith("/")) {
      const base = process.env.NEXTAUTH_URL || "http://localhost:3000"
      finalUrl = `${base}${url}`
    }
    const res = await fetch(finalUrl, { next: { revalidate: 0 } })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get("content-type") || ""
    const type = contentType.includes("png") ? "png" : "jpeg"
    return { buffer: buf, type }
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

    const nombre = String(profesional.user.nombre ?? "Profesional")
    const imageData = await getImageBuffer(profesional.user.fotoPerfil)

    const children: Paragraph[] = [
      new Paragraph({
        text: "Datos del Profesional",
        heading: HeadingLevel.TITLE,
      }),
    ]

    if (imageData) {
      try {
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imageData.buffer,
                transformation: { width: 100, height: 100 },
                type: imageData.type,
              }),
            ],
          })
        )
      } catch {
        // omitir foto si falla
      }
    }

    children.push(
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({ text: "Nombre: ", bold: true }),
          new TextRun({ text: nombre }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Especialidad: ", bold: true }),
          new TextRun({ text: String(profesional.especialidad ?? "—") }),
        ],
      })
    )

    if (profesional.matricula) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Matrícula: ", bold: true }),
            new TextRun({ text: profesional.matricula }),
          ],
        })
      )
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Email: ", bold: true }),
          new TextRun({ text: String(profesional.user.email ?? "—") }),
        ],
      })
    )

    if (profesional.user.telefono) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Teléfono: ", bold: true }),
            new TextRun({ text: profesional.user.telefono }),
          ],
        })
      )
    }

    if (profesional.user.dni) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "DNI: ", bold: true }),
            new TextRun({ text: profesional.user.dni }),
          ],
        })
      )
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Atiende Obra Social: ", bold: true }),
          new TextRun({ text: profesional.atiendeObraSocial ? "Sí" : "No" }),
        ],
      })
    )

    if (arancelesRaw.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Arancel: ", bold: true }),
            new TextRun({
              text: `$${arancelesRaw[0].monto}${arancelesRaw[0].descripcion ? ` - ${arancelesRaw[0].descripcion}` : ""}`,
            }),
          ],
        })
      )
    }

    if (horariosRaw.length > 0) {
      children.push(
        new Paragraph({ text: "Horarios de atención:", heading: HeadingLevel.HEADING_3 }),
        ...horariosRaw.map(
          (h) =>
            new Paragraph({
              text: `${h.diaSemana}: ${h.horaInicio} - ${h.horaFin}`,
            })
        )
      )
    }

    if (consultoriosRaw.length > 0) {
      children.push(
        new Paragraph({ text: "Consultorios:", heading: HeadingLevel.HEADING_3 }),
        ...consultoriosRaw.map(
          (c) =>
            new Paragraph({
              text: `${c.nombre} - ${c.direccion}`,
            })
        )
      )
    }

    const doc = new Document({
      sections: [{ children }],
    })

    const buffer = await Packer.toBuffer(doc)
    const filename = `profesional_${nombre.replace(/\s+/g, "_")}.docx`

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: unknown) {
    console.error("Error exportando DOCX profesional:", error)
    const message = error instanceof Error ? error.message : "Error al exportar DOCX"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
