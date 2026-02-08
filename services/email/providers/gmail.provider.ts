/**
 * Provider para Gmail SMTP
 * 
 * IMPORTANTE PARA GMAIL:
 * - Requiere verificación en 2 pasos activada
 * - Requiere App Password (Contraseña de aplicación) de 16 caracteres
 * - NO usar la contraseña normal de Gmail
 * - Generar App Password en: https://myaccount.google.com/apppasswords
 */

import nodemailer from "nodemailer"
import { BaseEmailProvider } from "./base.provider"
import { EmailOptions, EmailResult, EmailProvider } from "../types"

export interface GmailConfig {
  email: string
  appPassword: string // App Password de 16 caracteres
  fromName?: string
}

export class GmailProvider extends BaseEmailProvider {
  private gmailConfig: GmailConfig

  constructor(config: GmailConfig) {
    super(config)
    this.gmailConfig = config
  }

  getName(): EmailProvider {
    return "gmail"
  }

  isConfigured(): boolean {
    return !!(
      this.gmailConfig.email &&
      this.gmailConfig.appPassword &&
      this.gmailConfig.appPassword.replace(/\s/g, "").length === 16
    )
  }

  /**
   * Obtener transporter de Gmail (singleton)
   */
  protected async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter
    }

    // Validar configuración
    if (!this.isConfigured()) {
      throw new Error("Gmail no está configurado correctamente")
    }

    // Limpiar espacios de la App Password
    const cleanPassword = this.gmailConfig.appPassword.replace(/\s/g, "")

    // Crear transporter de Gmail
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true para puerto 465, false para otros
      auth: {
        user: this.gmailConfig.email,
        pass: cleanPassword,
      },
      tls: {
        rejectUnauthorized: false, // Gmail requiere esto en algunos casos
      },
    })

    return this.transporter
  }

  /**
   * Enviar email usando Gmail SMTP
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      // Validar opciones
      const validation = this.validateOptions(options)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          provider: "gmail",
        }
      }

      // Obtener transporter (singleton)
      const transporter = await this.getTransporter()

      // Preparar opciones de envío
      const mailOptions: nodemailer.SendMailOptions = {
        from: options.fromName
          ? `${options.fromName} <${this.gmailConfig.email}>`
          : this.gmailConfig.email,
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
        provider: "gmail",
      }
    } catch (error: any) {
      console.error("Error enviando email con Gmail:", error.message)
      return {
        success: false,
        error: error.message || "Error al enviar email con Gmail",
        provider: "gmail",
      }
    }
  }

  /**
   * Verificar conexión con Gmail SMTP
   */
  async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: "Gmail no está configurado correctamente. Verifica el email y la App Password.",
        }
      }

      const transporter = await this.getTransporter()

      // Verificar conexión
      await transporter.verify()

      return { success: true }
    } catch (error: any) {
      console.error("Error verificando conexión Gmail:", error.message)
      return {
        success: false,
        error: error.message || error.response || "Error de conexión con Gmail SMTP",
      }
    }
  }
}
