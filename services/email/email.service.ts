/**
 * EmailService - Servicio centralizado para envío de emails
 * 
 * Arquitectura modular y escalable que soporta múltiples proveedores:
 * - Gmail SMTP
 * - SMTP genérico
 * - Resend (fallback)
 * 
 * Características:
 * - Singleton pattern para transporters
 * - Retry automático configurable
 * - Cambio de proveedor sin modificar código
 * - Logging seguro (sin exponer contraseñas)
 */

import { EmailConfig, EmailOptions, EmailResult, EmailProvider, IEmailProvider } from "./types"
import { getEmailConfig } from "./email.config"
import { GmailProvider, GmailConfig } from "./providers/gmail.provider"
import { SmtpProvider, SmtpConfig } from "./providers/smtp.provider"
import { ResendProvider, ResendConfig } from "./providers/resend.provider"

// Re-exportar tipos para uso externo
export type { EmailOptions, EmailResult, EmailProvider } from "./types"

class EmailService {
  private static instance: EmailService
  private config: EmailConfig | null = null
  private providers: Map<EmailProvider, IEmailProvider> = new Map()
  private activeProvider: IEmailProvider | null = null

  private constructor() {
    // Constructor privado para singleton
  }

  /**
   * Obtener instancia singleton del servicio
   */
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  /**
   * Inicializar el servicio (cargar configuración y crear providers)
   */
  async initialize(): Promise<void> {
    if (this.config) {
      return // Ya inicializado
    }

    this.config = await getEmailConfig()
    await this.createProviders()
    await this.selectActiveProvider()
  }

  /**
   * Crear instancias de providers según configuración
   */
  private async createProviders(): Promise<void> {
    if (!this.config) {
      throw new Error("Configuración no inicializada")
    }

    // Crear provider de Gmail
    if (this.config.providers.gmail.enabled) {
      const gmailConfig: GmailConfig = {
        email: this.config.providers.gmail.credentials.email,
        appPassword: this.config.providers.gmail.credentials.appPassword,
        fromName: this.config.providers.gmail.credentials.fromName,
      }
      this.providers.set("gmail", new GmailProvider(gmailConfig))
    }

    // Crear provider SMTP genérico
    if (this.config.providers.smtp.enabled) {
      const smtpConfig: SmtpConfig = {
        host: this.config.providers.smtp.credentials.host,
        port: this.config.providers.smtp.credentials.port,
        secure: this.config.providers.smtp.credentials.secure,
        user: this.config.providers.smtp.credentials.user,
        password: this.config.providers.smtp.credentials.password,
        fromEmail: this.config.providers.smtp.credentials.fromEmail,
        fromName: this.config.providers.smtp.credentials.fromName,
        tls: this.config.providers.smtp.credentials.tls,
      }
      this.providers.set("smtp", new SmtpProvider(smtpConfig))
    }

    // Crear provider Resend (siempre disponible como fallback)
    if (this.config.providers.resend.enabled) {
      const resendConfig: ResendConfig = {
        apiKey: this.config.providers.resend.credentials.apiKey,
        fromEmail: this.config.providers.resend.credentials.fromEmail,
        fromName: this.config.providers.resend.credentials.fromName,
      }
      this.providers.set("resend", new ResendProvider(resendConfig))
    }
  }

  /**
   * Seleccionar el proveedor activo según configuración
   */
  private async selectActiveProvider(): Promise<void> {
    if (!this.config) {
      throw new Error("Configuración no inicializada")
    }

    // Intentar usar el proveedor por defecto
    const defaultProvider = this.config.defaultProvider
    const provider = this.providers.get(defaultProvider)

    if (provider && provider.isConfigured()) {
      this.activeProvider = provider
      return
    }

    // Si el proveedor por defecto no está disponible, buscar alternativas
    const priority: EmailProvider[] = ["gmail", "smtp", "resend"]

    for (const providerName of priority) {
      const provider = this.providers.get(providerName)
      if (provider && provider.isConfigured()) {
        this.activeProvider = provider
        // Log seguro: solo nombre del proveedor, sin credenciales
        console.log(`EmailService: Usando proveedor ${providerName} como activo`)
        return
      }
    }

    // Si ningún proveedor está disponible, usar Resend como último recurso
    if (this.config.providers.resend.enabled) {
      const resendProvider = this.providers.get("resend")
      if (resendProvider) {
        this.activeProvider = resendProvider
        console.warn("EmailService: Solo Resend está disponible. Configura SMTP para mejor rendimiento.")
        return
      }
    }

    throw new Error("Ningún proveedor de email está configurado correctamente")
  }

  /**
   * Enviar email con retry automático
   * 
   * @param options Opciones del email
   * @param retryCount Contador de reintentos (interno)
   * @param mode Modo de envío: "sync" (inmediato) o "queue" (en cola)
   */
  async sendEmail(
    options: EmailOptions,
    retryCount = 0,
    mode: "sync" | "queue" = "sync"
  ): Promise<EmailResult> {
    // Si el modo es "queue", agregar a la cola y retornar inmediatamente
    if (mode === "queue") {
      const { emailQueue } = await import("./email.queue")
      const jobId = await emailQueue.enqueueEmail({
        to: options.to,
        subject: options.subject,
        html: options.html,
        priority: "normal",
      })

      return {
        success: true,
        messageId: jobId, // Retornar jobId como messageId temporal
        provider: await this.getActiveProvider() || undefined,
      }
    }

    // Modo sync: procesar inmediatamente
    return await this.sendEmailInternal(options, retryCount)
  }

  /**
   * Enviar email internamente (usado por el worker de la cola)
   * @internal
   */
  async sendEmailInternal(options: EmailOptions, retryCount = 0): Promise<EmailResult> {
    try {
      // Asegurar que el servicio esté inicializado
      if (!this.config || !this.activeProvider) {
        await this.initialize()
      }

      if (!this.activeProvider) {
        throw new Error("No hay proveedor de email disponible")
      }

      // Intentar enviar
      const result = await Promise.race([
        this.activeProvider.send(options),
        this.createTimeoutPromise(this.config!.timeout),
      ])

      // Si fue exitoso, retornar
      if (result.success) {
        this.logEmailSent(result.provider ?? "resend", options.to, true)
        return result
      }

      // Si falló y hay retries disponibles, reintentar
      if (retryCount < this.config!.retry.maxRetries) {
        console.log(
          `EmailService: Reintentando envío (intento ${retryCount + 1}/${this.config!.retry.maxRetries})`
        )

        await this.sleep(this.config!.retry.retryDelay)

        // Intentar con otro proveedor si es posible
        if (retryCount === this.config!.retry.maxRetries - 1) {
          return await this.sendEmailWithFallback(options)
        }

        return await this.sendEmailInternal(options, retryCount + 1)
      }

      // Si se agotaron los retries, intentar con fallback
      return await this.sendEmailWithFallback(options)
    } catch (error: any) {
      console.error("Error en EmailService.sendEmail:", error.message)
      return {
        success: false,
        error: error.message || "Error al enviar email",
      }
    }
  }

  /**
   * Enviar email intentando con otros proveedores si el principal falla
   */
  private async sendEmailWithFallback(options: EmailOptions): Promise<EmailResult> {
    const priority: EmailProvider[] = ["gmail", "smtp", "resend"]

    for (const providerName of priority) {
      const provider = this.providers.get(providerName)
      if (provider && provider.isConfigured() && provider !== this.activeProvider) {
        try {
          console.log(`EmailService: Intentando fallback con ${providerName}`)
          const result = await provider.send(options)
          if (result.success) {
            this.logEmailSent(providerName, options.to, true)
            return result
          }
        } catch (error: any) {
          console.error(`Error con fallback ${providerName}:`, error.message)
        }
      }
    }

    // Si todos fallaron, retornar error
    return {
      success: false,
      error: "Todos los proveedores de email fallaron",
    }
  }

  /**
   * Probar conexión con el proveedor activo o uno específico
   * 
   * Si se proporciona configuración temporal, crea un provider temporal para la prueba
   */
  async testConnection(
    provider?: EmailProvider,
    tempConfig?: any
  ): Promise<{ success: boolean; error?: string; provider?: EmailProvider }> {
    try {
      let providerToTest: IEmailProvider | null = null

      // Si hay configuración temporal, crear provider temporal
      if (tempConfig) {
        const providerName = provider || (tempConfig.emailFrom?.toLowerCase().endsWith("@gmail.com") ? "gmail" : "smtp")
        
        if (providerName === "gmail") {
          providerToTest = new GmailProvider({
            email: tempConfig.emailFrom,
            appPassword: tempConfig.emailSmtpPassword,
            fromName: tempConfig.emailFromName,
          })
        } else {
          providerToTest = new SmtpProvider({
            host: tempConfig.emailSmtpHost,
            port: tempConfig.emailSmtpPort || 587,
            secure: tempConfig.emailSmtpSecure || false,
            user: tempConfig.emailSmtpUser,
            password: tempConfig.emailSmtpPassword,
            fromEmail: tempConfig.emailFrom,
            fromName: tempConfig.emailFromName,
          })
        }
      } else {
        // Usar configuración de DB/env
        await this.initialize()

        if (provider) {
          // Probar proveedor específico
          providerToTest = this.providers.get(provider) || null
          if (!providerToTest || !providerToTest.isConfigured()) {
            return {
              success: false,
              error: `El proveedor ${provider} no está configurado`,
              provider,
            }
          }
        } else {
          // Probar proveedor activo
          providerToTest = this.activeProvider
          if (!providerToTest) {
            return {
              success: false,
              error: "No hay proveedor de email disponible",
            }
          }
        }
      }

      if (!providerToTest) {
        return {
          success: false,
          error: "No se pudo crear el proveedor para la prueba",
        }
      }

      const result = await providerToTest.verifyConnection()

      // Limpiar provider temporal si se creó uno
      if (tempConfig && typeof (providerToTest as any).cleanup === "function") {
        await (providerToTest as any).cleanup()
      }

      return {
        success: result.success,
        error: result.error,
        provider: providerToTest.getName(),
      }
    } catch (error: any) {
      console.error("Error probando conexión:", error.message)
      return {
        success: false,
        error: error.message || "Error al probar conexión",
      }
    }
  }

  /**
   * Obtener el proveedor activo
   */
  async getActiveProvider(): Promise<EmailProvider | null> {
    await this.initialize()
    return this.activeProvider?.getName() || null
  }

  /**
   * Obtener información de configuración (sin credenciales)
   */
  async getConfigInfo(): Promise<{
    activeProvider: EmailProvider | null
    availableProviders: EmailProvider[]
    retryConfig: { maxRetries: number; retryDelay: number }
  }> {
    await this.initialize()

    const availableProviders: EmailProvider[] = []
    for (const [name, provider] of this.providers.entries()) {
      if (provider.isConfigured()) {
        availableProviders.push(name)
      }
    }

    return {
      activeProvider: this.activeProvider?.getName() || null,
      availableProviders,
      retryConfig: this.config!.retry,
    }
  }

  /**
   * Limpiar recursos (cerrar conexiones)
   */
  async cleanup(): Promise<void> {
    for (const provider of this.providers.values()) {
      if (typeof (provider as any).cleanup === "function") {
        await (provider as any).cleanup()
      }
    }
    this.providers.clear()
    this.activeProvider = null
    this.config = null
  }

  /**
   * Helper: Crear promesa de timeout
   */
  private createTimeoutPromise(timeout: number): Promise<EmailResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          error: `Timeout después de ${timeout}ms`,
        })
      }, timeout)
    })
  }

  /**
   * Helper: Sleep para retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Helper: Logging seguro (sin exponer contraseñas)
   * 
   * IMPORTANTE: Nunca loguear credenciales, passwords, o información sensible
   */
  private logEmailSent(provider: EmailProvider, to: string | string[], success: boolean): void {
    const recipients = Array.isArray(to) ? to.join(", ") : to
    // Solo loguear proveedor y destinatario, NUNCA credenciales
    console.log(
      `EmailService: Email ${success ? "enviado" : "fallido"} vía ${provider} a ${recipients}`
    )
  }

  /**
   * Helper: Sanitizar configuración para logging (remover passwords)
   */
  private sanitizeConfigForLogging(config: any): any {
    const sanitized = { ...config }
    if (sanitized.providers) {
      sanitized.providers = Object.keys(sanitized.providers).reduce((acc, key) => {
        acc[key] = { ...sanitized.providers[key] }
        if (acc[key].credentials) {
          acc[key].credentials = { ...acc[key].credentials }
          // Remover passwords de los logs
          if (acc[key].credentials.password) {
            acc[key].credentials.password = "[REDACTED]"
          }
          if (acc[key].credentials.appPassword) {
            acc[key].credentials.appPassword = "[REDACTED]"
          }
          if (acc[key].credentials.apiKey) {
            acc[key].credentials.apiKey = "[REDACTED]"
          }
        }
        return acc
      }, {} as any)
    }
    return sanitized
  }
}

// Exportar instancia singleton
export const emailService = EmailService.getInstance()

// Exportar función helper para uso directo
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  return await emailService.sendEmail(options)
}
