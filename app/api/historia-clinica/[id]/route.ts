import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()
    const { notas, diagnostico, tratamiento, estudios } = body

    // Actualizar historia clínica
    const historiaClinica = await prisma.historiaClinica.update({
      where: { id: params.id },
      data: {
        notas: notas || null,
        diagnostico: diagnostico || null,
        tratamiento: tratamiento || null,
      },
    })

    // Si hay estudios nuevos, agregarlos
    if (estudios && Array.isArray(estudios)) {
      // Eliminar estudios existentes que no están en la lista
      const estudiosExistentes = await prisma.archivoHistoriaClinica.findMany({
        where: { historiaClinicaId: params.id },
      })

      // Crear o actualizar estudios
      for (const estudio of estudios) {
        if (estudio.nombreArchivo) {
          // Si el estudio ya existe (tiene URL), mantenerlo
          const existe = estudiosExistentes.find(
            (e) => e.nombreArchivo === estudio.nombreArchivo
          )

          if (!existe) {
            // Crear nuevo estudio
            const contenido = estudio.contenido || ""
            await prisma.archivoHistoriaClinica.create({
              data: {
                historiaClinicaId: params.id,
                nombreArchivo: estudio.nombreArchivo,
                tipoArchivo: estudio.tipoArchivo || "TEXTO",
                urlArchivo: contenido.startsWith("data:")
                  ? contenido
                  : `data:text/plain;base64,${Buffer.from(contenido).toString("base64")}`,
                tamano: contenido.length,
              },
            })
          }
        }
      }

      // Eliminar estudios que ya no están en la lista
      const nombresEstudios = estudios
        .map((e: any) => e.nombreArchivo)
        .filter(Boolean)
      await prisma.archivoHistoriaClinica.deleteMany({
        where: {
          historiaClinicaId: params.id,
          nombreArchivo: {
            notIn: nombresEstudios,
          },
        },
      })
    }

    return NextResponse.json({
      message: "Historia clínica actualizada exitosamente",
      historiaClinica,
    })
  } catch (error: any) {
    console.error("Error actualizando historia clínica:", error)
    return NextResponse.json(
      { error: error.message || "Error al actualizar historia clínica" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "SECRETARIA")
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await prisma.historiaClinica.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: "Registro eliminado exitosamente",
    })
  } catch (error: any) {
    console.error("Error eliminando registro:", error)
    return NextResponse.json(
      { error: "Error al eliminar registro" },
      { status: 500 }
    )
  }
}
