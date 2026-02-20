/**
 * Provider para Resend
 * Servicio de email como fallback cuando SMTP no está disponible
 */

import { Resend } from "resend"
import { BaseEmailProvider } from "./base.provider"
import { EmailOptions, EmailResult, EmailProvider } from "../types"

export interface ResendConfig {
  apiKey: string
  fromEmail?: string
  fromName?: string
}

export class ResendProvider extends BaseEmailProvider {
  private resendConfig: ResendConfig
  private resendClient: Resend | null = null

  constructor(config: ResendConfig) {
    super(config)
    this.resendConfig = config
  }

  getName(): EmailProvider {
    return "resend"
  }

  isConfigured(): boolean {
    return !!this.resendConfig.apiKey
  }

  /**
   * Obtener cliente de Resend (singleton)
   */
  protected async getTransporter(): Promise<Resend> {
    if (this.resendClient) {
      return this.resendClient
    }

    if (!this.isConfigured()) {
      throw new Error("Resend no está configurado correctamente")
    }

    this.resendClient = new Resend(this.resendConfig.apiKey)
    return this.resendClient
  }

  /**
   * Enviar email usando Resend
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      // Validar opciones
      const validation = this.validateOptions(options)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          provider: "resend",
        }
      }

      // Obtener cliente (singleton)
      const client = await this.getTransporter()

      // Preparar destinatarios
      const recipients = Array.isArray(options.to) ? options.to : [options.to]

      // Formato "from": Resend exige "Nombre <email>". Sin dominio verificado usar onboarding@resend.dev
      const fromEmail = options.from || this.resendConfig.fromEmail || "onboarding@resend.dev"
      const fromName = options.fromName || this.resendConfig.fromName || "Agenda Profesional"
      const fromFormatted = fromEmail.includes("<") ? fromEmail : `${fromName} <${fromEmail}>`

      // Enviar email
      const { data, error } = await client.emails.send({
        from: fromFormatted,
        to: recipients,
        subject: options.subject,
        html: options.html,
        text: options.text,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
        reply_to: options.replyTo,
      })

      if (error) {
        return {
          success: false,
          error: error.message || "Error al enviar email con Resend",
          provider: "resend",
        }
      }

      return {
        success: true,
        messageId: data?.id,
        provider: "resend",
      }
    } catch (error: any) {
      console.error("Error enviando email con Resend:", error.message)
      return {
        success: false,
        error: error.message || "Error al enviar email con Resend",
        provider: "resend",
      }
    }
  }

  /**
   * Verificar conexión con Resend
   * Resend no tiene un método de verificación directo, así que intentamos obtener la API key
   */
  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: "Resend no está configurado correctamente. Falta la API key.",
        }
      }

      // Resend no tiene método de verificación, pero podemos validar que la API key existe
      // En producción, podrías hacer una llamada a la API de Resend para verificar
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Error verificando Resend",
      }
    }
  }
}
