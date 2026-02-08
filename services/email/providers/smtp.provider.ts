/**
 * Provider para SMTP genérico
 * Soporta cualquier servidor SMTP configurable
 */

import nodemailer from "nodemailer"
import { BaseEmailProvider } from "./base.provider"
import { EmailOptions, EmailResult, EmailProvider } from "../types"

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean // true para SSL/TLS en puerto 465
  user: string
  password: string
  fromEmail: string
  fromName?: string
  tls?: {
    rejectUnauthorized?: boolean
  }
}

export class SmtpProvider extends BaseEmailProvider {
  private smtpConfig: SmtpConfig

  constructor(config: SmtpConfig) {
    super(config)
    this.smtpConfig = config
  }

  getName(): EmailProvider {
    return "smtp"
  }

  isConfigured(): boolean {
    return !!(
      this.smtpConfig.host &&
      this.smtpConfig.port &&
      this.smtpConfig.user &&
      this.smtpConfig.password &&
      this.smtpConfig.fromEmail
    )
  }

  /**
   * Obtener transporter SMTP (singleton)
   */
  protected async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter
    }

    // Validar configuración
    if (!this.isConfigured()) {
      throw new Error("SMTP no está configurado correctamente")
    }

    // Crear transporter SMTP
    this.transporter = nodemailer.createTransport({
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      secure: this.smtpConfig.secure, // true para puerto 465
      auth: {
        user: this.smtpConfig.user,
        pass: this.smtpConfig.password,
      },
      tls: this.smtpConfig.tls || {
        rejectUnauthorized: false,
      },
    })

    return this.transporter
  }

  /**
   * Enviar email usando SMTP genérico
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      // Validar opciones
      const validation = this.validateOptions(options)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          provider: "smtp",
        }
      }

      // Obtener transporter (singleton)
      const transporter = await this.getTransporter()

      // Preparar opciones de envío
      const mailOptions: nodemailer.SendMailOptions = {
        from: options.fromName
          ? `${options.fromName} <${this.smtpConfig.fromEmail}>`
          : this.smtpConfig.fromEmail,
        to: this.formatRecipients(options.to),
        subject: options.subject,
        html: options.html,
        text: options.text,
        cc: options.cc ? this.formatRecipients(options.cc) : undefined,
        bcc: options.bcc ? this.formatRecipients(options.bcc) : undefined,
        replyTo: options.replyTo,
      }

      // Enviar email
      const info = await transporter.sendMail(mailOptions)

      return {
        success: true,
        messageId: info.messageId,
        provider: "smtp",
      }
    } catch (error: any) {
      console.error("Error enviando email con SMTP:", error.message)
      return {
        success: false,
        error: error.message || "Error al enviar email con SMTP",
        provider: "smtp",
      }
    }
  }

  /**
   * Verificar conexión con SMTP
   */
  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: "SMTP no está configurado correctamente",
        }
      }

      const transporter = await this.getTransporter()

      // Verificar conexión
      await transporter.verify()

      return { success: true }
    } catch (error: any) {
      console.error("Error verificando conexión SMTP:", error.message)
      return {
        success: false,
        error: error.message || error.response || "Error de conexión SMTP",
      }
    }
  }
}
