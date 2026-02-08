/**
 * Tipos y interfaces para el sistema de emails
 */

export type EmailProvider = "gmail" | "smtp" | "resend"

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  fromName?: string
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string
  attachments?: EmailAttachment[]
}

export interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  provider?: EmailProvider
}

export interface EmailProviderConfig {
  provider: EmailProvider
  enabled: boolean
  credentials: Record<string, any>
  options?: Record<string, any>
}

export interface EmailConfig {
  defaultProvider: EmailProvider
  providers: Record<EmailProvider, EmailProviderConfig>
  retry: {
    maxRetries: number
    retryDelay: number // en milisegundos
  }
  timeout: number // en milisegundos
}

export interface IEmailProvider {
  /**
   * Enviar un email
   */
  send(options: EmailOptions): Promise<EmailResult>

  /**
   * Verificar conexión con el proveedor
   */
  verifyConnection(): Promise<{ success: boolean; error?: string }>

  /**
   * Obtener nombre del proveedor
   */
  getName(): EmailProvider

  /**
   * Verificar si el proveedor está configurado correctamente
   */
  isConfigured(): boolean
}

/**
 * Job de email para procesamiento en cola
 */
export interface EmailJob {
  id: string
  to: string | string[]
  subject: string
  template?: "turno-confirmado" | "turno-cancelado" | "recordatorio" | "custom"
  html?: string
  data?: Record<string, any>
  priority?: "high" | "normal" | "low"
  retries?: number
  maxRetries?: number
  createdAt: Date
  scheduledFor?: Date
  attempts: number
  lastError?: string
  metadata?: Record<string, any>
}

/**
 * Estado de un job en la cola
 */
export type JobStatus = "pending" | "processing" | "completed" | "failed" | "retrying"

/**
 * Resultado del procesamiento de un job
 */
export interface JobProcessResult {
  success: boolean
  jobId: string
  messageId?: string
  error?: string
  provider?: EmailProvider
  attempts: number
}

/**
 * Métricas de la cola de emails
 */
export interface EmailQueueMetrics {
  pending: number
  processing: number
  completed: number
  failed: number
  totalProcessed: number
  lastError?: string
  lastProcessedAt?: Date
  averageProcessingTime?: number
}
