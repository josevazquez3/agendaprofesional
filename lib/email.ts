/**
 * Wrapper para compatibilidad con código existente
 * 
 * Esta función ahora usa EmailService internamente.
 * Se mantiene para no romper código existente que llama a sendEmail directamente.
 * 
 * Para nuevo código, usar sendSystemEmail de services/email/email-templates.ts
 */

import { sendEmail as emailServiceSendEmail } from "@/services/email/email.service"
import { EmailOptions } from "@/services/email/types"

/**
 * Función principal para enviar emails
 * 
 * @deprecated Usar sendSystemEmail de services/email/email-templates.ts para nuevos desarrollos
 * Esta función se mantiene para compatibilidad con código existente
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    const options: EmailOptions = {
      to,
      subject,
      html,
    }

    const result = await emailServiceSendEmail(options)

    // Convertir resultado al formato esperado por código legacy
    if (result.success) {
      return {
        success: true,
        data: {
          messageId: result.messageId,
        },
      }
    } else {
      return {
        success: false,
        error: result.error,
      }
    }
  } catch (error: any) {
    console.error("Error enviando email:", error.message)
    return {
      success: false,
      error: error.message || "Error al enviar email",
    }
  }
}

/**
 * Funciones de generación de templates (mantenidas para compatibilidad)
 * 
 * @deprecated Usar sendSystemEmail de services/email/email-templates.ts para nuevos desarrollos
 * Estas funciones se mantienen para compatibilidad con código existente
 */

// Re-exportar desde el nuevo módulo de templates
export { sendSystemEmail } from "@/services/email/email-templates"

// Mantener funciones de generación para compatibilidad
export function generateTurnoConfirmationEmail(
  pacienteNombre: string,
  profesionalNombre: string,
  fecha: string,
  hora: string,
  consultorio?: string
) {
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

export function generateTurnoCancellationEmail(
  pacienteNombre: string,
  profesionalNombre: string,
  fecha: string,
  hora: string,
  motivo?: string
) {
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
