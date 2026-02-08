/**
 * Provider base abstracto para todos los proveedores de email
 */

import { IEmailProvider, EmailOptions, EmailResult, EmailProvider } from "../types"

export abstract class BaseEmailProvider implements IEmailProvider {
  protected config: any
  protected transporter: any = null

  constructor(config: any) {
    this.config = config
  }

  abstract getName(): EmailProvider
  abstract send(options: EmailOptions): Promise<EmailResult>
  abstract verifyConnection(): Promise<{ success: boolean; error?: string }>
  abstract isConfigured(): boolean

  /**
   * Obtener el transporter (singleton pattern)
   * Cada provider implementa su propia lógica
   */
  protected abstract getTransporter(): Promise<any>

  /**
   * Limpiar recursos (cerrar conexiones, etc.)
   */
  async cleanup(): Promise<void> {
    if (this.transporter && typeof this.transporter.close === "function") {
      try {
        await this.transporter.close()
      } catch (error) {
        console.error(`Error cerrando conexión ${this.getName()}:`, error)
      }
    }
    this.transporter = null
  }

  /**
   * Validar opciones de email antes de enviar
   */
  protected validateOptions(options: EmailOptions): { valid: boolean; error?: string } {
    if (!options.to || (Array.isArray(options.to) && options.to.length === 0)) {
      return { valid: false, error: "El destinatario es requerido" }
    }

    if (!options.subject || options.subject.trim() === "") {
      return { valid: false, error: "El asunto es requerido" }
    }

    if (!options.html || options.html.trim() === "") {
      return { valid: false, error: "El contenido HTML es requerido" }
    }

    return { valid: true }
  }

  /**
   * Formatear destinatarios (string o array)
   */
  protected formatRecipients(recipients: string | string[]): string {
    if (Array.isArray(recipients)) {
      return recipients.join(", ")
    }
    return recipients
  }
}
