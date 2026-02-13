import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireAuthWithRolesAndClinic, verifyProfessionalOwnership, createAuthErrorResponse } from "@/lib/auth-helpers"

export async function POST(
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
    const { nombreArchivo, tipoArchivo, urlArchivo, tamano } = body

    if (!nombreArchivo || !tipoArchivo || !urlArchivo) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Verificar que la historia clínica existe
    const historiaClinica = await prisma.historiaClinica.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        clinicId: true,
        profesionalId: true,
      },
    })

    if (!historiaClinica) {
      return createAuthErrorResponse("NOT_FOUND")
    }

    // Validar que pertenece a la clínica activa
    if (historiaClinica.clinicId !== authResult.clinicId) {
      return createAuthErrorResponse("FORBIDDEN", {
        message: "Este registro no pertenece a su clínica activa.",
      })
    }

    // Verificar ownership para profesionales
    if (session.user.role === "PROFESIONAL") {
      const hasOwnership = await verifyProfessionalOwnership(
        historiaClinica.profesionalId,
        session.user.id
      )

      if (!hasOwnership) {
        return createAuthErrorResponse("OWNERSHIP_REQUIRED")
      }
    }

    // Crear el archivo
    const archivo = await prisma.archivoHistoriaClinica.create({
      data: {
        historiaClinicaId: params.id,
        nombreArchivo,
        tipoArchivo,
        urlArchivo,
        tamano: tamano || 0,
      },
    })

    return NextResponse.json({
      message: "Estudio cargado exitosamente",
      archivo,
    })
  } catch (error: any) {
    // Log error para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.error("Error cargando estudio:", error)
    }
    
    if (error.code === "P2025") {
      return createAuthErrorResponse("NOT_FOUND")
    }
    
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Error de referencia: la historia clínica no existe." },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || "Error al cargar estudio. Por favor, intente nuevamente." },
      { status: 500 }
    )
  }
}
