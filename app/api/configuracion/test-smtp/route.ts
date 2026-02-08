import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { emailService } from "@/services/email/email.service"
import { sendSystemEmail } from "@/services/email/email-templates"
import { EmailProvider } from "@/services/email/types"

/**
 * Endpoint para probar la conexión SMTP usando EmailService
 * 
 * Este endpoint utiliza exactamente EmailService.testConnection() para garantizar
 * que la prueba use el mismo código que el sistema de producción.
 * 
 * Solo accesible para usuarios ADMIN.
 * 
 * Para Gmail específicamente:
 * - Requiere verificación en 2 pasos activada
 * - Requiere App Password (Contraseña de aplicación) de 16 caracteres
 * - No usar la contraseña normal de Gmail
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      emailFrom,
      emailFromName,
      emailSmtpHost,
      emailSmtpPort,
      emailSmtpUser,
      emailSmtpPassword,
      emailSmtpSecure,
    } = body

    // Validaciones básicas
    if (!emailFrom || !emailSmtpHost || !emailSmtpUser || !emailSmtpPassword) {
      return NextResponse.json(
        { error: "Faltan campos requeridos para la configuración SMTP" },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailFrom)) {
      return NextResponse.json(
        { error: "El formato del email no es válido" },
        { status: 400 }
      )
    }

    // Validar App Password de Gmail si es Gmail
    const isGmail = emailFrom.toLowerCase().endsWith("@gmail.com") || 
                    emailFrom.toLowerCase().endsWith("@googlemail.com")
    
    if (isGmail) {
      const cleanPassword = emailSmtpPassword.replace(/\s/g, "")
      if (cleanPassword.length !== 16) {
        return NextResponse.json(
          { error: "La contraseña de aplicación de Gmail debe tener exactamente 16 caracteres" },
          { status: 400 }
        )
      }
    }

    // Determinar qué proveedor probar
    const providerToTest: EmailProvider = isGmail ? "gmail" : "smtp"

    // Usar EmailService.testConnection() con configuración temporal
    // Esto garantiza que la prueba use exactamente el mismo código que el sistema de producción
    const testResult = await emailService.testConnection(providerToTest, {
      emailFrom,
      emailFromName,
      emailSmtpHost,
      emailSmtpPort,
      emailSmtpUser,
      emailSmtpPassword,
      emailSmtpSecure,
    })

    if (!testResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: testResult.error || "Error de conexión SMTP",
        },
        { status: 500 }
      )
    }

    // Si la conexión es exitosa, guardar configuración y enviar email de prueba
    const testEmailTo = session.user.email || emailFrom

    try {
      // Guardar configuración en DB para que EmailService la use al enviar
      const { saveConfiguracion } = await import("@/lib/configuracion-helpers")
      await saveConfiguracion({
        emailFrom,
        emailFromName,
        emailSmtpHost,
        emailSmtpPort,
        emailSmtpUser,
        emailSmtpPassword,
        emailSmtpSecure,
      })

      // Reinicializar EmailService para que cargue la nueva configuración
      await emailService.cleanup()
      await emailService.initialize()

      // Enviar email de prueba usando sendSystemEmail (que usa EmailService internamente)
      const sendResult = await sendSystemEmail(
        "custom",
        testEmailTo,
        {},
        {
          subject: "Prueba de configuración SMTP - Agenda Profesional",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                  .content { padding: 20px; background-color: #f9fafb; border-radius: 0 0 5px 5px; }
                  .success-box { background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; }
                  .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>✅ Configuración SMTP Exitosa</h1>
                  </div>
                  <div class="content">
                    <div class="success-box">
                      <p><strong>¡Conexión SMTP verificada correctamente!</strong></p>
                      <p>Este es un email de prueba enviado desde tu configuración SMTP.</p>
                    </div>
                    <div class="info-box">
                      <p><strong>Configuración utilizada:</strong></p>
                      <ul>
                        <li><strong>Servidor:</strong> ${emailSmtpHost}</li>
                        <li><strong>Puerto:</strong> ${emailSmtpPort}</li>
                        <li><strong>Seguridad:</strong> ${emailSmtpSecure ? "TLS/SSL" : "Sin seguridad"}</li>
                        <li><strong>Remitente:</strong> ${emailFrom}</li>
                        <li><strong>Proveedor:</strong> ${testResult.provider || providerToTest}</li>
                      </ul>
                    </div>
                    <p>Si recibiste este email, significa que tu configuración SMTP está funcionando correctamente y puedes comenzar a enviar correos desde la aplicación.</p>
                    <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                      Este es un email automático de prueba. No respondas a este mensaje.
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `,
        }
      )

      if (!sendResult.success) {
        throw new Error(sendResult.error || "Error al enviar email de prueba")
      }

      return NextResponse.json({
        success: true,
        message: `Email de prueba enviado exitosamente a ${testEmailTo}`,
        provider: testResult.provider,
      })
    } catch (sendError: any) {
      console.error("Error enviando email de prueba:", sendError.message)
      return NextResponse.json(
        {
          success: false,
          error: `Error al enviar email de prueba: ${sendError.message || "Error desconocido"}`,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error en test SMTP:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al probar la conexión SMTP",
        details: error.code || error.response,
      },
      { status: 500 }
    )
  }
}
