import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProfesionalById } from "@/lib/profesional-helpers"
import { sendEmail } from "@/lib/email"
import { sendWhatsAppMessage } from "@/lib/whatsapp"
import { generateTurnoConfirmationEmail } from "@/lib/email"
import { generateTurnoConfirmationWhatsApp } from "@/lib/whatsapp"
import { logCreate } from "@/lib/audit-service"
import { getActiveClinic } from "@/lib/clinic-context"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { pacienteId: pacienteIdParam, profesionalId, fecha, hora, motivo, obraSocial, obraSocialId, consultorioProfesionalId } = body

    // Validaciones básicas
    if (!profesionalId || !fecha || !hora) {
      return NextResponse.json(
        { error: `Faltan campos requeridos. profesionalId: ${profesionalId}, fecha: ${fecha}, hora: ${hora}` },
        { status: 400 }
      )
    }

    // Si es secretaria o admin, puede especificar pacienteId
    // Si es paciente, solo puede crear turnos para sí mismo
    let pacienteId: string
    if (session.user.role === "SECRETARIA" || session.user.role === "ADMIN") {
      if (!pacienteIdParam) {
        return NextResponse.json(
          { error: "El pacienteId es requerido para crear turnos" },
          { status: 400 }
        )
      }
      pacienteId = pacienteIdParam
    } else if (session.user.role === "PACIENTE") {
      pacienteId = session.user.id
    } else {
      return NextResponse.json(
        { error: "No autorizado para crear turnos" },
        { status: 403 }
      )
    }

    // Verificar que el profesional existe (una sola consulta)
    const profesional = await getProfesionalById(profesionalId, {
      includeUser: true,
      includeUserFields: ["nombre", "email"],
    })

    if (!profesional) {
      return NextResponse.json(
        { error: "Profesional no encontrado" },
        { status: 404 }
      )
    }

    // Normalizar fecha (asegurar que sea a medianoche para comparación correcta)
    const fechaTurno = new Date(fecha)
    fechaTurno.setHours(0, 0, 0, 0)
    const fechaFin = new Date(fechaTurno)
    fechaFin.setHours(23, 59, 59, 999)

    // Verificar que no haya un turno en el mismo horario usando helper
    const { existeTurnoEnHorario } = await import("@/lib/turno-helpers")
    const turnoExistente = await existeTurnoEnHorario(
      profesionalId,
      fechaTurno,
      hora,
      ["PENDIENTE", "CONFIRMADO"]
    )
    
    if (turnoExistente) {
      return NextResponse.json(
        { error: `Ya existe un turno en este horario (${fecha} ${hora})` },
        { status: 400 }
      )
    }

    // Obtener datos del paciente usando SQL raw
    const pacienteResult = await prisma.$queryRawUnsafe<Array<{
      id: string
      nombre: string
      email: string
      telefono: string | null
    }>>(
      `SELECT id, nombre, email, telefono FROM User WHERE id = ? LIMIT 1`,
      pacienteId
    )

    if (pacienteResult.length === 0) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      )
    }

    const paciente = pacienteResult[0]

    // Obtener clinicId (usar un valor por defecto o obtenerlo de la clínica activa)
    let clinicId: string | null = null
    try {
      const clinic = await getActiveClinic()
      if (clinic) {
        clinicId = clinic.id
      } else {
        // Si no hay clínica activa, intentar obtener la primera clínica del usuario
        const clinicUserResult = await prisma.$queryRawUnsafe<Array<{
          clinicId: string
        }>>(
          `SELECT clinicId FROM ClinicUser WHERE userId = ? AND activo = 1 LIMIT 1`,
          session.user.id
        )
        if (clinicUserResult.length > 0) {
          clinicId = clinicUserResult[0].clinicId
        }
      }
      
      // Si aún no tenemos clinicId, intentar obtener la primera clínica disponible
      if (!clinicId) {
        const primeraClinic = await prisma.$queryRawUnsafe<Array<{
          id: string
        }>>(
          `SELECT id FROM Clinic LIMIT 1`
        )
        if (primeraClinic.length > 0) {
          clinicId = primeraClinic[0].id
        }
      }
      
      // Si aún no tenemos clinicId, crear uno por defecto o usar un valor temporal
      if (!clinicId) {
        console.warn("No se encontró ninguna clínica, usando valor por defecto")
        // Intentar crear una clínica por defecto si no existe
        try {
          const clinicDefaultId = `clinic_default_${Date.now()}`
          await prisma.$executeRawUnsafe(
            `INSERT OR IGNORE INTO Clinic (id, nombre, slug, activo, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?)`,
            clinicDefaultId,
            "Clínica por Defecto",
            "default",
            1,
            new Date().toISOString(),
            new Date().toISOString()
          )
          clinicId = clinicDefaultId
        } catch (createError) {
          console.error("Error creando clínica por defecto:", createError)
          // Usar un valor temporal que puede causar error, pero al menos veremos el error real
          clinicId = "default-clinic"
        }
      }
    } catch (error) {
      console.error("Error obteniendo clinicId:", error)
      clinicId = "default-clinic"
    }
    
    if (!clinicId) {
      return NextResponse.json(
        { error: "No se pudo determinar la clínica para crear el turno" },
        { status: 500 }
      )
    }

    // Crear turno usando SQL raw para evitar problemas con clinicId
    const fechaCreacion = new Date(fecha)
    fechaCreacion.setHours(0, 0, 0, 0)
    const codigoTurno = `T${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    const ahora = new Date()
    const turnoId = `turno_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Formatear fecha para SQLite (ISO string completo para DateTime)
    const fechaSQL = fechaCreacion.toISOString()
    const ahoraISO = ahora.toISOString()

    // Intentar insertar sin clinicId primero (para SQLite sin la columna)
    // Si falla, intentar con clinicId
    let turnoCreado = false
    
    try {
      // Primero intentar sin clinicId (para SQLite de desarrollo)
      await prisma.$executeRawUnsafe(
        `INSERT INTO Turno (
          id, pacienteId, profesionalId, consultorioProfesionalId,
          fecha, hora, estado, motivo, obraSocial, obraSocialId,
          codigoTurno, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        turnoId,
        pacienteId,
        profesionalId,
        consultorioProfesionalId || null,
        fechaSQL,
        hora,
        "PENDIENTE",
        motivo || null,
        obraSocial || null,
        obraSocialId || null,
        codigoTurno,
        ahoraISO,
        ahoraISO
      )
      turnoCreado = true
    } catch (errorSinClinicId: any) {
      // Si falla porque falta clinicId, intentar con clinicId
      if (errorSinClinicId.message && errorSinClinicId.message.includes('clinicId')) {
        try {
          await prisma.$executeRawUnsafe(
            `INSERT INTO Turno (
              id, clinicId, pacienteId, profesionalId, consultorioProfesionalId,
              fecha, hora, estado, motivo, obraSocial, obraSocialId,
              codigoTurno, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            turnoId,
            clinicId,
            pacienteId,
            profesionalId,
            consultorioProfesionalId || null,
            fechaSQL,
            hora,
            "PENDIENTE",
            motivo || null,
            obraSocial || null,
            obraSocialId || null,
            codigoTurno,
            ahoraISO,
            ahoraISO
          )
          turnoCreado = true
        } catch (errorConClinicId: any) {
          console.error("Error en INSERT de turno (con clinicId):", errorConClinicId)
          console.error("Datos del INSERT:", {
            turnoId,
            clinicId,
            pacienteId,
            profesionalId,
            fechaSQL,
            hora,
            codigoTurno,
          })
          throw errorConClinicId
        }
      } else {
        // Si el error no es por clinicId, lanzarlo
        console.error("Error en INSERT de turno (sin clinicId):", errorSinClinicId)
        console.error("Datos del INSERT:", {
          turnoId,
          pacienteId,
          profesionalId,
          fechaSQL,
          hora,
          codigoTurno,
        })
        throw errorSinClinicId
      }
    }

    // Obtener el turno creado usando helper
    const turnosCreados = await prisma.$queryRawUnsafe<Array<{
      id: string
      codigoTurno: string
      pacienteId: string
      profesionalId: string
      fecha: string
      hora: string
      estado: string
      motivo: string | null
    }>>(
      `SELECT id, codigoTurno, pacienteId, profesionalId, fecha, hora, estado, motivo 
       FROM Turno 
       WHERE codigoTurno = ? 
       LIMIT 1`,
      codigoTurno
    )

    if (turnosCreados.length === 0) {
      throw new Error("No se pudo crear el turno")
    }

    const turno = {
      id: turnosCreados[0].id,
      codigoTurno: turnosCreados[0].codigoTurno,
      pacienteId: turnosCreados[0].pacienteId,
      profesionalId: turnosCreados[0].profesionalId,
      fecha: new Date(turnosCreados[0].fecha),
      hora: turnosCreados[0].hora,
      estado: turnosCreados[0].estado,
      motivo: turnosCreados[0].motivo,
      paciente: {
        id: paciente.id,
        nombre: paciente.nombre,
        email: paciente.email,
      },
          profesional: {
            id: profesional.id,
            user: profesional.user ? {
              id: profesional.userId,
              nombre: profesional.user.nombre || "",
              email: profesional.user.email || "",
            } : {
              id: profesional.userId,
              nombre: "",
              email: "",
            },
          },
    }

    // Notificaciones y auditoría en paralelo (no bloquean ni fallan la respuesta)
    const fechaFormateada = new Date(fecha).toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const nombreProfesional = profesional.user?.nombre || "Profesional"

    await Promise.allSettled([
      // 1. Email al paciente
      paciente.email
        ? sendEmail({
            to: paciente.email,
            subject: "Turno Confirmado - Agenda Profesional",
            html: generateTurnoConfirmationEmail(paciente.nombre, nombreProfesional, fechaFormateada, hora),
          })
        : Promise.resolve(),
      // 2. WhatsApp al paciente
      paciente.telefono
        ? sendWhatsAppMessage({
            to: paciente.telefono,
            message: generateTurnoConfirmationWhatsApp(
              paciente.nombre,
              nombreProfesional,
              fechaFormateada,
              hora,
              turno.codigoTurno
            ),
          })
        : Promise.resolve(),
      // 3. Notificaciones in-app
      prisma.notificacion.createMany({
        data: [
          {
            userId: pacienteId,
            turnoId: turno.id,
            tipo: "TURNO_CONFIRMADO",
            titulo: "Turno Confirmado",
            mensaje: `Su turno con ${nombreProfesional} ha sido confirmado para el ${fechaFormateada} a las ${hora}`,
          },
          {
            userId: profesional.userId,
            turnoId: turno.id,
            tipo: "NUEVO_TURNO",
            titulo: "Nuevo Turno",
            mensaje: `Nuevo turno con ${paciente.nombre} el ${fechaFormateada} a las ${hora}`,
          },
        ],
      }),
      // 4. Auditoría (reutilizando clinicId ya obtenido)
      clinicId
        ? logCreate(
            clinicId,
            session.user.id,
            "APPOINTMENT",
            turno.id,
            {
              pacienteId: turno.pacienteId,
              profesionalId: turno.profesionalId,
              fecha: turno.fecha.toISOString(),
              hora: turno.hora,
              motivo: turno.motivo,
              estado: turno.estado,
            },
            request as any
          )
        : Promise.resolve(),
    ])

    return NextResponse.json(
      {
        message: "Turno creado exitosamente",
        turno,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creando turno:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
      cause: error?.cause,
    })
    
    // Mensaje más específico según el tipo de error
    let errorMessage = "Error al crear turno"
    if (error?.message?.includes("UNIQUE constraint")) {
      errorMessage = "Ya existe un turno con ese código"
    } else if (error?.message?.includes("FOREIGN KEY constraint")) {
      errorMessage = "Error de referencia: verifique que el paciente, profesional o clínica existan"
    } else if (error?.message?.includes("NOT NULL constraint")) {
      errorMessage = "Faltan campos requeridos"
    } else if (process.env.NODE_ENV === "development") {
      errorMessage = error?.message || errorMessage
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? {
          message: error?.message,
          code: error?.code,
          meta: error?.meta,
        } : undefined
      },
      { status: 500 }
    )
  }
}
