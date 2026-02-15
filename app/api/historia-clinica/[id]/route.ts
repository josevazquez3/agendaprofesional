import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProfesionalByUserId } from "@/lib/profesional-helpers"
import { requireAuthWithRolesAndClinic, verifyProfessionalOwnership, createAuthErrorResponse } from "@/lib/auth-helpers"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validar autenticación, roles y clínica activa
    const authResult = await requireAuthWithRolesAndClinic([
      "ADMIN",
      "SECRETARIA",
      "PROFESIONAL",
    ])

    if (!authResult || !authResult.allowed) {
      return authResult?.error || createAuthErrorResponse("UNAUTHORIZED")
    }

    const session = authResult.session

    const body = await request.json()
    const { notas, diagnostico, tratamiento, estudios, version } = body

    // Obtener historia clínica existente para validaciones
    const historiaExistente = await prisma.historiaClinica.findUnique({
      where: { id: params.id },
      include: {
        profesional: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    })

    if (!historiaExistente) {
      return createAuthErrorResponse("NOT_FOUND")
    }

    // Validar ownership: Si es PROFESIONAL, solo puede editar sus propias historias
    if (session.user.role === "PROFESIONAL") {
      const hasOwnership = await verifyProfessionalOwnership(
        historiaExistente.profesionalId,
        session.user.id
      )
      
      if (!hasOwnership) {
        return createAuthErrorResponse("OWNERSHIP_REQUIRED")
      }
    }

    // Validar que la historia clínica pertenece a la clínica activa
    if (historiaExistente.clinicId !== authResult.clinicId) {
      return createAuthErrorResponse("FORBIDDEN", {
        message: "Este registro no pertenece a su clínica activa.",
      })
    }

    // Control de concurrencia: Verificar que no haya sido modificado desde la última lectura
    if (version && historiaExistente.updatedAt) {
      const versionTimestamp = new Date(version).getTime()
      const existingTimestamp = new Date(historiaExistente.updatedAt).getTime()
      
      if (Math.abs(existingTimestamp - versionTimestamp) > 1000) {
        // Diferencia mayor a 1 segundo indica posible edición simultánea
        return createAuthErrorResponse("CONCURRENT_EDIT", {
          conflict: true,
          currentVersion: historiaExistente.updatedAt.toISOString(),
        })
      }
    }

    // Usar transacción para asegurar atomicidad de la operación
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar historia clínica
      const historiaClinicaActualizada = await tx.historiaClinica.update({
        where: { id: params.id },
        data: {
          notas: notas !== undefined ? (notas || null) : undefined,
          diagnostico: diagnostico !== undefined ? (diagnostico || null) : undefined,
          tratamiento: tratamiento !== undefined ? (tratamiento || null) : undefined,
        },
      })

      // Si hay estudios nuevos, procesarlos dentro de la transacción
      if (estudios && Array.isArray(estudios)) {
        // Obtener estudios existentes
        const estudiosExistentes = await tx.archivoHistoriaClinica.findMany({
          where: { historiaClinicaId: params.id },
        })

        // Crear nuevos estudios
        for (const estudio of estudios) {
          if (estudio.nombreArchivo) {
            // Si el estudio ya existe (por nombre), mantenerlo
            const existe = estudiosExistentes.find(
              (e) => e.nombreArchivo === estudio.nombreArchivo
            )

            if (!existe) {
              // Crear nuevo estudio
              const contenido = estudio.contenido || ""
              await tx.archivoHistoriaClinica.create({
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
        await tx.archivoHistoriaClinica.deleteMany({
          where: {
            historiaClinicaId: params.id,
            nombreArchivo: {
              notIn: nombresEstudios,
            },
          },
        })
      }

      return historiaClinicaActualizada
    })

    return NextResponse.json({
      message: "Historia clínica actualizada exitosamente",
      historiaClinica: resultado,
    })
  } catch (error: any) {
    // Log error para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.error("Error actualizando historia clínica:", error)
    }
    
    // Manejar errores específicos de Prisma
    if (error.code === "P2025") {
      return createAuthErrorResponse("NOT_FOUND")
    }
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un registro con estos datos. Por favor, verifique la información." },
        { status: 409 }
      )
    }
    
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Error de referencia: verifique que los datos relacionados existan." },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error.message || "Error al actualizar historia clínica. Por favor, intente nuevamente." 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuthWithRolesAndClinic([
      "ADMIN",
      "SECRETARIA",
      "PROFESIONAL",
    ])

    if (!authResult || !authResult.allowed) {
      return authResult?.error || createAuthErrorResponse("UNAUTHORIZED")
    }

    const session = authResult.session

    let causa = ""
    try {
      const body = await request.json()
      causa = (body?.causa ?? "").trim()
    } catch {
      // body opcional en DELETE
    }
    if (!causa) {
      return NextResponse.json(
        { error: "La causa de eliminación es obligatoria." },
        { status: 400 }
      )
    }

    const historiaExistente = await prisma.historiaClinica.findUnique({
      where: { id: params.id },
      select: { clinicId: true, profesionalId: true },
    })

    if (!historiaExistente) {
      return createAuthErrorResponse("NOT_FOUND")
    }

    if (historiaExistente.clinicId !== authResult.clinicId) {
      return createAuthErrorResponse("FORBIDDEN", {
        message: "Este registro no pertenece a su clínica activa.",
      })
    }

    // Si es PROFESIONAL, solo puede eliminar registros creados por él
    if (session.user.role === "PROFESIONAL") {
      const hasOwnership = await verifyProfessionalOwnership(
        historiaExistente.profesionalId,
        session.user.id
      )
      if (!hasOwnership) {
        return createAuthErrorResponse("OWNERSHIP_REQUIRED")
      }
    }

    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE HistoriaClinica ADD COLUMN eliminadoAt DATETIME`
      )
    } catch {
      // Columna ya existe
    }
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE HistoriaClinica ADD COLUMN motivoEliminacion TEXT`
      )
    } catch {
      // Columna ya existe
    }
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE HistoriaClinica ADD COLUMN eliminadoPorId TEXT`
      )
    } catch {
      // Columna ya existe
    }

    const ahora = new Date().toISOString()
    await prisma.$executeRawUnsafe(
      `UPDATE HistoriaClinica SET eliminadoAt = ?, motivoEliminacion = ?, eliminadoPorId = ? WHERE id = ?`,
      ahora,
      causa,
      session.user.id,
      params.id
    )

    return NextResponse.json({
      message: "Registro marcado como eliminado (eliminación lógica).",
    })
  } catch (error: any) {
    // Log error para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.error("Error eliminando registro:", error)
    }
    
    if (error.code === "P2025") {
      return createAuthErrorResponse("NOT_FOUND")
    }
    
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "No se puede eliminar el registro porque tiene datos relacionados." },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Error al eliminar registro. Por favor, intente nuevamente." },
      { status: 500 }
    )
  }
}
