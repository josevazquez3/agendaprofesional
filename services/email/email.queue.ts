/**
 * Email Queue - Sistema de cola para procesamiento asíncrono de emails
 * 
 * Implementación inicial con cola en memoria, preparada para migrar a:
 * - Redis / BullMQ
 * - AWS SQS
 * - RabbitMQ
 * 
 * Características:
 * - Cola en memoria con prioridades
 * - Worker interno con procesamiento periódico
 * - Retry automático con exponential backoff
 * - Métricas internas
 * - No bloquea el servidor principal
 */

import { EmailJob, JobStatus, JobProcessResult, EmailQueueMetrics } from "./types"
import { emailService } from "./email.service"
import { sendSystemEmail } from "./email-templates"
import { EmailOptions } from "./types"

class EmailQueue {
  private static instance: EmailQueue
  private queue: Map<string, EmailJob> = new Map()
  private processing: Set<string> = new Set()
  private completed: Map<string, EmailJob> = new Map()
  private failed: Map<string, EmailJob> = new Map()
  private workerInterval: NodeJS.Timeout | null = null
  private isProcessing: boolean = false
  private metrics: EmailQueueMetrics = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    totalProcessed: 0,
  }
  private processingTimes: number[] = []

  // Configuración del worker
  private readonly WORKER_INTERVAL_MS = parseInt(process.env.EMAIL_QUEUE_INTERVAL_MS || "5000") // 5 segundos por defecto
  private readonly MAX_CONCURRENT_JOBS = parseInt(process.env.EMAIL_QUEUE_MAX_CONCURRENT || "3") // Máximo 3 jobs simultáneos
  private readonly DEFAULT_MAX_RETRIES = parseInt(process.env.EMAIL_QUEUE_MAX_RETRIES || "2")
  private readonly DEFAULT_RETRY_DELAY_MS = parseInt(process.env.EMAIL_QUEUE_RETRY_DELAY_MS || "1000")

  private constructor() {
    // Constructor privado para singleton
  }

  /**
   * Obtener instancia singleton
   */
  static getInstance(): EmailQueue {
    if (!EmailQueue.instance) {
      EmailQueue.instance = new EmailQueue()
    }
    return EmailQueue.instance
  }

  /**
   * Iniciar el worker que procesa la cola
   */
  startWorker(): void {
    if (this.workerInterval) {
      console.log("EmailQueue: Worker ya está corriendo")
      return
    }

    console.log(`EmailQueue: Iniciando worker (intervalo: ${this.WORKER_INTERVAL_MS}ms)`)
    
    this.workerInterval = setInterval(() => {
      this.processQueue().catch((error) => {
        console.error("EmailQueue: Error en worker:", error.message)
      })
    }, this.WORKER_INTERVAL_MS)

    // Procesar inmediatamente al iniciar
    this.processQueue().catch((error) => {
      console.error("EmailQueue: Error en procesamiento inicial:", error.message)
    })
  }

  /**
   * Detener el worker
   */
  stopWorker(): void {
    if (this.workerInterval) {
      clearInterval(this.workerInterval)
      this.workerInterval = null
      console.log("EmailQueue: Worker detenido")
    }
  }

  /**
   * Agregar email a la cola
   */
  async enqueueEmail(job: Omit<EmailJob, "id" | "createdAt" | "attempts" | "status">): Promise<string> {
    const jobId = this.generateJobId()
    const emailJob: EmailJob = {
      id: jobId,
      createdAt: new Date(),
      attempts: 0,
      maxRetries: job.maxRetries || this.DEFAULT_MAX_RETRIES,
      retries: job.retries || 0,
      ...job,
    }

    this.queue.set(jobId, emailJob)
    this.updateMetrics()

    console.log(`EmailQueue: Job ${jobId} agregado a la cola (prioridad: ${job.priority || "normal"})`)

    // Si el worker no está corriendo, iniciarlo
    if (!this.workerInterval) {
      this.startWorker()
    }

    return jobId
  }

  /**
   * Procesar la cola de emails
   */
  private async processQueue(): Promise<void> {
    // Evitar procesamiento concurrente
    if (this.isProcessing) {
      return
    }

    // Verificar si hay jobs pendientes
    const pendingJobs = Array.from(this.queue.values())
      .filter((job) => !this.processing.has(job.id))
      .sort((a, b) => this.comparePriority(a.priority, b.priority))

    if (pendingJobs.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      // Procesar hasta MAX_CONCURRENT_JOBS jobs simultáneamente
      const jobsToProcess = pendingJobs.slice(0, this.MAX_CONCURRENT_JOBS)

      await Promise.allSettled(
        jobsToProcess.map((job) => this.processJob(job))
      )
    } finally {
      this.isProcessing = false
      this.updateMetrics()
    }
  }

  /**
   * Procesar un job individual
   */
  private async processJob(job: EmailJob): Promise<void> {
    const startTime = Date.now()

    // Marcar como procesando
    this.processing.add(job.id)
    this.updateMetrics()

    try {
      // Verificar si el job está programado para el futuro
      if (job.scheduledFor && job.scheduledFor > new Date()) {
        this.processing.delete(job.id)
        return
      }

      // Procesar el email
      const result = await this.executeEmailJob(job)

      const processingTime = Date.now() - startTime
      this.processingTimes.push(processingTime)

      if (result.success) {
        // Job completado exitosamente
        this.queue.delete(job.id)
        this.completed.set(job.id, { ...job, attempts: job.attempts + 1 })
        this.metrics.completed++
        this.metrics.totalProcessed++
        this.metrics.lastProcessedAt = new Date()

        console.log(
          `EmailQueue: Job ${job.id} completado exitosamente (provider: ${result.provider}, tiempo: ${processingTime}ms)`
        )
      } else {
        // Job falló, intentar retry
        await this.handleJobFailure(job, result.error || "Error desconocido")
      }
    } catch (error: any) {
      const processingTime = Date.now() - startTime
      console.error(`EmailQueue: Error procesando job ${job.id}:`, error.message)
      await this.handleJobFailure(job, error.message || "Error desconocido")
    } finally {
      this.processing.delete(job.id)
      this.updateMetrics()
    }
  }

  /**
   * Ejecutar el envío del email según el job
   */
  private async executeEmailJob(job: EmailJob): Promise<JobProcessResult> {
    try {
      let result: { success: boolean; messageId?: string; error?: string; provider?: string }

      if (job.template) {
        // Usar template del sistema
        const templateResult = await sendSystemEmail(
          job.template,
          job.to,
          job.data || {},
          {
            subject: job.subject,
            html: job.html,
          }
        )
        result = {
          success: templateResult.success,
          error: templateResult.error,
        }
      } else {
        // Envío directo con HTML
        if (!job.html) {
          throw new Error("HTML es requerido cuando no se usa template")
        }

        const emailResult = await emailService.sendEmail({
          to: job.to,
          subject: job.subject,
          html: job.html,
        })

        result = {
          success: emailResult.success,
          messageId: emailResult.messageId,
          error: emailResult.error,
          provider: emailResult.provider,
        }
      }

      return {
        success: result.success || false,
        jobId: job.id,
        messageId: result.messageId,
        error: result.error,
        provider: result.provider as any,
        attempts: job.attempts + 1,
      }
    } catch (error: any) {
      return {
        success: false,
        jobId: job.id,
        error: error.message || "Error al ejecutar job",
        attempts: job.attempts + 1,
      }
    }
  }

  /**
   * Manejar fallo de un job (retry o marcar como fallido)
   */
  private async handleJobFailure(job: EmailJob, error: string): Promise<void> {
    const maxRetries = job.maxRetries || this.DEFAULT_MAX_RETRIES
    const currentAttempts = job.attempts + 1

    job.attempts = currentAttempts
    job.lastError = error

    if (currentAttempts < maxRetries) {
      // Calcular delay con exponential backoff
      const delayMs = this.calculateRetryDelay(currentAttempts)
      const scheduledFor = new Date(Date.now() + delayMs)

      job.scheduledFor = scheduledFor
      job.retries = (job.retries || 0) + 1

      console.log(
        `EmailQueue: Job ${job.id} falló (intento ${currentAttempts}/${maxRetries}). Reintentando en ${delayMs}ms`
      )

      // Mantener el job en la cola para retry
      this.queue.set(job.id, job)
    } else {
      // Agotados los reintentos, marcar como fallido
      this.queue.delete(job.id)
      this.failed.set(job.id, job)
      this.metrics.failed++
      this.metrics.lastError = error

      console.error(
        `EmailQueue: Job ${job.id} falló permanentemente después de ${currentAttempts} intentos. Error: ${error}`
      )
    }
  }

  /**
   * Calcular delay para retry con exponential backoff
   * Formula: baseDelay * (2 ^ (attempt - 1))
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.DEFAULT_RETRY_DELAY_MS
    return baseDelay * Math.pow(2, attempt - 1)
  }

  /**
   * Comparar prioridades de jobs
   */
  private comparePriority(a?: "high" | "normal" | "low", b?: "high" | "normal" | "low"): number {
    const priorityMap = { high: 3, normal: 2, low: 1 }
    const priorityA = priorityMap[a || "normal"]
    const priorityB = priorityMap[b || "normal"]
    return priorityB - priorityA // Mayor prioridad primero
  }

  /**
   * Generar ID único para job
   */
  private generateJobId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Actualizar métricas
   */
  private updateMetrics(): void {
    this.metrics.pending = this.queue.size
    this.metrics.processing = this.processing.size
    this.metrics.completed = this.completed.size
    this.metrics.failed = this.failed.size

    // Calcular tiempo promedio de procesamiento
    if (this.processingTimes.length > 0) {
      const sum = this.processingTimes.reduce((a, b) => a + b, 0)
      this.metrics.averageProcessingTime = sum / this.processingTimes.length

      // Mantener solo los últimos 100 tiempos para el promedio
      if (this.processingTimes.length > 100) {
        this.processingTimes = this.processingTimes.slice(-100)
      }
    }
  }

  /**
   * Obtener métricas de la cola
   */
  getMetrics(): EmailQueueMetrics {
    this.updateMetrics()
    return { ...this.metrics }
  }

  /**
   * Obtener estado de un job específico
   */
  getJobStatus(jobId: string): { status: JobStatus; job?: EmailJob } {
    if (this.queue.has(jobId)) {
      const job = this.queue.get(jobId)!
      if (this.processing.has(jobId)) {
        return { status: "processing", job }
      }
      return { status: "pending", job }
    }

    if (this.completed.has(jobId)) {
      return { status: "completed", job: this.completed.get(jobId) }
    }

    if (this.failed.has(jobId)) {
      return { status: "failed", job: this.failed.get(jobId) }
    }

    return { status: "pending" }
  }

  /**
   * Limpiar jobs completados y fallidos antiguos (más de 24 horas)
   */
  cleanup(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 horas

    // Limpiar completados antiguos
    for (const [id, job] of this.completed.entries()) {
      if (now - job.createdAt.getTime() > maxAge) {
        this.completed.delete(id)
      }
    }

    // Limpiar fallidos antiguos
    for (const [id, job] of this.failed.entries()) {
      if (now - job.createdAt.getTime() > maxAge) {
        this.failed.delete(id)
      }
    }

    this.updateMetrics()
  }
}

// Exportar instancia singleton
export const emailQueue = EmailQueue.getInstance()

// Iniciar worker automáticamente si está en entorno de servidor
if (typeof window === "undefined") {
  // Solo en servidor (Node.js), no en cliente
  emailQueue.startWorker()

  // Limpiar jobs antiguos cada hora
  setInterval(() => {
    emailQueue.cleanup()
  }, 60 * 60 * 1000)
}
