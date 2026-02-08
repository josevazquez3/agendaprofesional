import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/user-helpers"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from "docx"

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

    // Crear contenido del documento
    const children: (Paragraph | Table)[] = [
      new Paragraph({
        text: "Historia Clínica",
        heading: HeadingLevel.TITLE,
      }),
      new Paragraph({
        text: `Paciente: ${paciente.nombre}`,
      }),
      ...(paciente.dni
        ? [
            new Paragraph({
              text: `DNI: ${paciente.dni}`,
            }),
          ]
        : []),
      new Paragraph({
        text: `Email: ${paciente.email}`,
      }),
      ...(paciente.fechaNacimiento
        ? [
            new Paragraph({
              text: `Fecha de Nacimiento: ${new Date(paciente.fechaNacimiento).toLocaleDateString("es-AR")}`,
            }),
          ]
        : []),
      new Paragraph({ text: "" }),
      new Paragraph({
        text: "Registros Médicos",
        heading: HeadingLevel.HEADING_1,
      }),
    ]

    // Agregar cada registro
    historiaClinica.forEach((registro, index) => {
      children.push(
        new Paragraph({
          text: `Registro ${index + 1} - ${new Date(registro.fechaConsulta).toLocaleDateString("es-AR")}`,
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: `Profesional: ${registro.profesional.user.nombre} - ${registro.profesional.especialidad}`,
        }),
        ...(registro.turno
          ? [
              new Paragraph({
                text: `Turno: ${new Date(registro.turno.fecha).toLocaleDateString("es-AR")} - ${registro.turno.hora}`,
              }),
            ]
          : []),
        ...(registro.notas
          ? [
              new Paragraph({
                text: "Observaciones:",
                heading: HeadingLevel.HEADING_3,
              }),
              new Paragraph({
                text: registro.notas,
              }),
            ]
          : []),
        ...(registro.diagnostico
          ? [
              new Paragraph({
                text: "Diagnóstico:",
                heading: HeadingLevel.HEADING_3,
              }),
              new Paragraph({
                text: registro.diagnostico,
              }),
            ]
          : []),
        ...(registro.tratamiento
          ? [
              new Paragraph({
                text: "Tratamiento:",
                heading: HeadingLevel.HEADING_3,
              }),
              new Paragraph({
                text: registro.tratamiento,
              }),
            ]
          : []),
        ...(registro.archivos.length > 0
          ? [
              new Paragraph({
                text: "Estudios:",
                heading: HeadingLevel.HEADING_3,
              }),
              ...registro.archivos.map(
                (archivo) =>
                  new Paragraph({
                    text: `- ${archivo.nombreArchivo} (${archivo.tipoArchivo})`,
                  })
              ),
            ]
          : []),
        new Paragraph({ text: "" })
      )
    })

    const doc = new Document({
      sections: [
        {
          children,
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="historia_clinica_${paciente.nombre.replace(/\s/g, "_")}.docx"`,
      },
    })
  } catch (error: any) {
    console.error("Error exportando DOC:", error)
    return NextResponse.json(
      { error: "Error al exportar DOC" },
      { status: 500 }
    )
  }
}
