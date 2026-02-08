/**
 * Configuración centralizada del sistema de emails
 * 
 * Esta configuración puede construirse desde:
 * - Variables de entorno (.env)
 * - Configuración almacenada en base de datos
 * 
 * El sistema detecta automáticamente qué proveedor usar basándose en la configuración disponible.
 */

import { EmailConfig, EmailProvider, EmailProviderConfig } from "./types"
import { getConfiguracion } from "@/lib/configuracion-helpers"

/**
 * Construir configuración desde variables de entorno
 */
function buildConfigFromEnv(): Partial<EmailConfig> {
  const defaultProvider: EmailProvider = 
    (process.env.EMAIL_PROVIDER as EmailProvider) || "resend"

  const config: Partial<EmailConfig> = {
    defaultProvider,
    retry: {
      maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || "2"),
      retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || "1000"),
    },
    timeout: parseInt(process.env.EMAIL_TIMEOUT || "30000"),
    providers: {
      gmail: {
        provider: "gmail",
        enabled: !!process.env.GMAIL_EMAIL && !!process.env.GMAIL_APP_PASSWORD,
        credentials: {
          email: process.env.GMAIL_EMAIL || "",
          appPassword: process.env.GMAIL_APP_PASSWORD || "",
          fromName: process.env.EMAIL_FROM_NAME || "Agenda Profesional",
        },
      },
      smtp: {
        provider: "smtp",
        enabled: !!(
          process.env.SMTP_HOST &&
          process.env.SMTP_USER &&
          process.env.SMTP_PASSWORD
        ),
        credentials: {
          host: process.env.SMTP_HOST || "",
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
          user: process.env.SMTP_USER || "",
          password: process.env.SMTP_PASSWORD || "",
          fromEmail: process.env.EMAIL_FROM || "",
          fromName: process.env.EMAIL_FROM_NAME || "Agenda Profesional",
        },
      },
      resend: {
        provider: "resend",
        enabled: !!process.env.RESEND_API_KEY,
        credentials: {
          apiKey: process.env.RESEND_API_KEY || "",
          fromEmail: process.env.EMAIL_FROM || "noreply@agendaprofesional.com",
          fromName: process.env.EMAIL_FROM_NAME || "Agenda Profesional",
        },
      },
    },
  }

  return config
}

/**
 * Construir configuración desde base de datos
 */
async function buildConfigFromDB(): Promise<Partial<EmailConfig>> {
  try {
    const dbConfig = await getConfiguracion()

    // Detectar proveedor activo basándose en la configuración disponible
    let defaultProvider: EmailProvider = "resend"

    // Si hay configuración SMTP completa, usar SMTP
    if (
      dbConfig.emailSmtpHost &&
      dbConfig.emailSmtpUser &&
      dbConfig.emailSmtpPassword
    ) {
      // Detectar si es Gmail
      const isGmail =
        dbConfig.emailFrom?.toLowerCase().endsWith("@gmail.com") ||
        dbConfig.emailFrom?.toLowerCase().endsWith("@googlemail.com")

      if (isGmail) {
        defaultProvider = "gmail"
      } else {
        defaultProvider = "smtp"
      }
    }

    const config: Partial<EmailConfig> = {
      defaultProvider,
      retry: {
        maxRetries: 2,
        retryDelay: 1000,
      },
      timeout: 30000,
      providers: {
        gmail: {
          provider: "gmail",
          enabled: !!(
            dbConfig.emailFrom &&
            dbConfig.emailSmtpPassword &&
            (dbConfig.emailFrom.toLowerCase().endsWith("@gmail.com") ||
              dbConfig.emailFrom.toLowerCase().endsWith("@googlemail.com"))
          ),
          credentials: {
            email: dbConfig.emailFrom || "",
            appPassword: dbConfig.emailSmtpPassword || "",
            fromName: dbConfig.emailFromName || "Agenda Profesional",
          },
        },
        smtp: {
          provider: "smtp",
          enabled: !!(
            dbConfig.emailSmtpHost &&
            dbConfig.emailSmtpUser &&
            dbConfig.emailSmtpPassword &&
            dbConfig.emailFrom
          ),
          credentials: {
            host: dbConfig.emailSmtpHost || "",
            port: dbConfig.emailSmtpPort || 587,
            secure: dbConfig.emailSmtpSecure || false,
            user: dbConfig.emailSmtpUser || "",
            password: dbConfig.emailSmtpPassword || "",
            fromEmail: dbConfig.emailFrom || "",
            fromName: dbConfig.emailFromName || "Agenda Profesional",
          },
        },
        resend: {
          provider: "resend",
          enabled: !!process.env.RESEND_API_KEY, // Resend siempre disponible desde env
          credentials: {
            apiKey: process.env.RESEND_API_KEY || "",
            fromEmail: dbConfig.emailFrom || process.env.EMAIL_FROM || "noreply@agendaprofesional.com",
            fromName: dbConfig.emailFromName || process.env.EMAIL_FROM_NAME || "Agenda Profesional",
          },
        },
      },
    }

    return config
  } catch (error) {
    console.error("Error construyendo configuración desde DB:", error)
    // Fallback a variables de entorno
    return buildConfigFromEnv()
  }
}

/**
 * Obtener configuración completa del sistema de emails
 * Prioriza configuración de DB sobre variables de entorno
 */
export async function getEmailConfig(): Promise<EmailConfig> {
  // Intentar obtener de DB primero
  const dbConfig = await buildConfigFromDB()
  const envConfig = buildConfigFromEnv()

  // Combinar configuraciones (DB tiene prioridad)
  const config: EmailConfig = {
    defaultProvider: dbConfig.defaultProvider || envConfig.defaultProvider || "resend",
    retry: {
      maxRetries: dbConfig.retry?.maxRetries || envConfig.retry?.maxRetries || 2,
      retryDelay: dbConfig.retry?.retryDelay || envConfig.retry?.retryDelay || 1000,
    },
    timeout: dbConfig.timeout || envConfig.timeout || 30000,
    providers: {
      gmail: {
        provider: "gmail",
        enabled: dbConfig.providers?.gmail?.enabled || envConfig.providers?.gmail?.enabled || false,
        credentials: {
          ...envConfig.providers?.gmail?.credentials,
          ...dbConfig.providers?.gmail?.credentials,
        },
      },
      smtp: {
        provider: "smtp",
        enabled: dbConfig.providers?.smtp?.enabled || envConfig.providers?.smtp?.enabled || false,
        credentials: {
          ...envConfig.providers?.smtp?.credentials,
          ...dbConfig.providers?.smtp?.credentials,
        },
      },
      resend: {
        provider: "resend",
        enabled: dbConfig.providers?.resend?.enabled || envConfig.providers?.resend?.enabled || false,
        credentials: {
          ...envConfig.providers?.resend?.credentials,
          ...dbConfig.providers?.resend?.credentials,
        },
      },
    },
  }

  return config
}

/**
 * Obtener configuración para un proveedor específico (para pruebas)
 */
export async function getProviderConfig(provider: EmailProvider): Promise<any> {
  const config = await getEmailConfig()
  return config.providers[provider]
}
