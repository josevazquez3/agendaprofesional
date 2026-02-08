/**
 * Email Service - Punto de entrada principal
 * 
 * Exporta todas las funciones y tipos necesarios para usar el sistema de emails
 */

export { emailService, sendEmail } from "./email.service"
export { sendSystemEmail } from "./email-templates"
export { emailQueue } from "./email.queue"
export type { EmailOptions, EmailResult, EmailProvider, EmailJob, EmailQueueMetrics, JobStatus } from "./types"
export { getEmailConfig, getProviderConfig } from "./email.config"
