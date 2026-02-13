import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTurnoById } from "@/lib/turno-helpers"
import { getActiveClinic } from "@/lib/clinic-context"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar permisos
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SECRETARIA" &&
      session.user.role !== "PROFESIONAL"
    ) {
      return NextResponse.json(
        { error: "No tiene permisos para aceptar turnos" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { motivo, archivos } = body

    // Obtener turno con toda la información necesaria usando helper
    const turno = await getTurnoById(params.id)

    if (!turno) {
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 }
      )
    }

    // Crear fecha de consulta combinando fecha y hora del turno
    const fechaConsulta = new Date(turno.fecha)
    const [horas, minutos] = turno.hora.split(":")
    fechaConsulta.setHours(parseInt(horas), parseInt(minutos), 0, 0)

    // Verificar si ya existe una historia clínica para este turno
    let historiaClinica = await prisma.historiaClinica.findUnique({
      where: { turnoId: params.id },
    })

    if (historiaClinica) {
      // Actualizar historia clínica existente
      historiaClinica = await prisma.historiaClinica.update({
        where: { id: historiaClinica.id },
        data: {
          notas: motivo || null,
          fechaConsulta,
        },
      })
    } else {
      // Obtener clinicId del turno o de la clínica activa
      let clinicId: string | null = turno.clinicId || null
      
      if (!clinicId) {
        const clinic = await getActiveClinic()
        clinicId = clinic?.id || null
      }
      
      if (!clinicId) {
        return NextResponse.json(
          { error: "No se pudo determinar la clínica activa" },
          { status: 400 }
        )
      }
      
      // Crear nueva historia clínica
      historiaClinica = await prisma.historiaClinica.create({
        data: {
          clinicId,
          pacienteId: turno.pacienteId,
          profesionalId: turno.profesionalId,
          turnoId: turno.id,
          fechaConsulta,
          notas: motivo || null,
        },
      })
    }

    // Si hay archivos adjuntos, guardarlos
    if (archivos && Array.isArray(archivos) && archivos.length > 0) {
      for (const archivo of archivos) {
        if (archivo.nombreArchivo && archivo.urlArchivo) {
          await prisma.archivoHistoriaClinica.create({
            data: {
              historiaClinicaId: historiaClinica.id,
              nombreArchivo: archivo.nombreArchivo,
              tipoArchivo: archivo.tipoArchivo || "PDF",
              urlArchivo: archivo.urlArchivo,
              tamano: archivo.tamano || 0,
            },
          })
        }
      }
    }

    // Actualizar el estado del turno a COMPLETADO
    await prisma.turno.update({
      where: { id: params.id },
      data: {
        estado: "COMPLETADO",
        motivo: motivo || turno.motivo,
      },
    })

    return NextResponse.json({
      message: "Turno aceptado y guardado en historia clínica exitosamente",
      historiaClinica,
    })
  } catch (error: any) {
    console.error("Error aceptando turno:", error)
    return NextResponse.json(
      { error: error.message || "Error al aceptar turno" },
      { status: 500 }
    )
  }
}
