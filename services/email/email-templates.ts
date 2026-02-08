/**
 * Templates de emails del sistema
 * Helper para generar emails comunes de la aplicación
 */

import { EmailOptions } from "./types"

/**
 * Enviar email del sistema usando templates predefinidos
 * 
 * Este helper asegura que todo el código use el EmailService centralizado
 * en lugar de llamar directamente a nodemailer o resend
 * 
 * @param mode Modo de envío: "sync" (inmediato) o "queue" (en cola)
 */
export async function sendSystemEmail(
  template: "turno-confirmado" | "turno-cancelado" | "recordatorio" | "custom",
  to: string | string[],
  data: {
    pacienteNombre?: string
    profesionalNombre?: string
    fecha?: string
    hora?: string
    consultorio?: string
    motivo?: string
    [key: string]: any
  },
  customOptions?: Partial<EmailOptions>,
  mode: "sync" | "queue" = "sync"
): Promise<{ success: boolean; error?: string }> {
  let html = ""
  let subject = ""

  switch (template) {
    case "turno-confirmado":
      subject = "Turno Confirmado - Agenda Profesional"
      html = generateTurnoConfirmationEmail(
        data.pacienteNombre || "Paciente",
        data.profesionalNombre || "Profesional",
        data.fecha || "",
        data.hora || "",
        data.consultorio
      )
      break

    case "turno-cancelado":
      subject = "Turno Cancelado - Agenda Profesional"
      html = generateTurnoCancellationEmail(
        data.pacienteNombre || "Paciente",
        data.profesionalNombre || "Profesional",
        data.fecha || "",
        data.hora || "",
        data.motivo
      )
      break

    case "recordatorio":
      subject = `Recordatorio: Turno el ${data.fecha} a las ${data.hora}`
      html = generateReminderEmail(
        data.pacienteNombre || "Paciente",
        data.profesionalNombre || "Profesional",
        data.fecha || "",
        data.hora || "",
        data.consultorio
      )
      break

    case "custom":
      subject = customOptions?.subject || "Notificación - Agenda Profesional"
      html = customOptions?.html || ""
      break
  }

  const options: EmailOptions = {
    to,
    subject,
    html,
    ...customOptions,
  }

  // Si el modo es "queue", usar la cola directamente
  if (mode === "queue") {
    const { emailQueue } = await import("./email.queue")
    const jobId = await emailQueue.enqueueEmail({
      to,
      subject,
      template,
      html: customOptions?.html,
      data,
      priority: "normal",
    })

    return {
      success: true,
      // No hay error porque el job se agregó exitosamente a la cola
    }
  }

  // Modo sync: enviar inmediatamente
  const { sendEmail: sendEmailInternal } = await import("./email.service")
  const result = await sendEmailInternal(options, 0, "sync")
  return {
    success: result.success,
    error: result.error,
  }
}

/**
 * Template: Email de confirmación de turno
 */
function generateTurnoConfirmationEmail(
  pacienteNombre: string,
  profesionalNombre: string,
  fecha: string,
  hora: string,
  consultorio?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Turno Confirmado</h1>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${pacienteNombre}</strong>,</p>
            <p>Su turno ha sido confirmado exitosamente:</p>
            <div class="info-box">
              <p><strong>Profesional:</strong> ${profesionalNombre}</p>
              <p><strong>Fecha:</strong> ${fecha}</p>
              <p><strong>Hora:</strong> ${hora}</p>
              ${consultorio ? `<p><strong>Consultorio:</strong> ${consultorio}</p>` : ''}
            </div>
            <p>Por favor, llegue 10 minutos antes de su turno.</p>
            <p>Si necesita cancelar o modificar su turno, puede hacerlo desde su panel de usuario.</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no responda.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Template: Email de cancelación de turno
 */
function generateTurnoCancellationEmail(
  pacienteNombre: string,
  profesionalNombre: string,
  fecha: string,
  hora: string,
  motivo?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #dc2626; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Turno Cancelado</h1>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${pacienteNombre}</strong>,</p>
            <p>Su turno ha sido cancelado:</p>
            <div class="info-box">
              <p><strong>Profesional:</strong> ${profesionalNombre}</p>
              <p><strong>Fecha:</strong> ${fecha}</p>
              <p><strong>Hora:</strong> ${hora}</p>
              ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ''}
            </div>
            <p>Puede solicitar un nuevo turno desde su panel de usuario.</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no responda.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Template: Email de recordatorio
 */
function generateReminderEmail(
  pacienteNombre: string,
  profesionalNombre: string,
  fecha: string,
  hora: string,
  consultorio?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #f59e0b; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Recordatorio de Turno</h1>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${pacienteNombre}</strong>,</p>
            <p>Le recordamos que tiene un turno programado:</p>
            <div class="info-box">
              <p><strong>Profesional:</strong> ${profesionalNombre}</p>
              <p><strong>Fecha:</strong> ${fecha}</p>
              <p><strong>Hora:</strong> ${hora}</p>
              ${consultorio ? `<p><strong>Consultorio:</strong> ${consultorio}</p>` : ''}
            </div>
            <p>Por favor, llegue 10 minutos antes de su turno.</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no responda.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
