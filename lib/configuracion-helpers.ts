/**
 * Configuración Helpers
 * Funciones helper para consultas de Configuración usando SQL raw
 */

import { prisma } from "./prisma"

export interface ConfiguracionSistema {
  // Notificaciones
  notificacionesEmail: boolean
  notificacionesWhatsApp: boolean
  notificacionesInApp: boolean
  recordatorioTurnoHoras: number
  
  // Parámetros de turnos
  duracionTurnoDefault: number
  anticipacionMinimaHoras: number
  anticipacionMaximaDias: number
  permitirCancelacionOnline: boolean
  horasCancelacionMinimas: number
  
  // Email
  emailFrom: string
  emailFromName: string
  emailSmtpHost: string
  emailSmtpPort: number
  emailSmtpUser: string
  emailSmtpPassword: string
  emailSmtpSecure: boolean
  
  // WhatsApp
  whatsappEnabled: boolean
  whatsappProvider: string // 'twilio' | '360dialog' | 'otro'
  whatsappAccountSid: string
  whatsappAuthToken: string
  whatsappPhoneNumber: string
  
  // Seguridad
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSpecial: boolean
  sessionTimeoutMinutes: number
  maxLoginAttempts: number
  
  // Backup
  backupAutomatico: boolean
  backupFrecuencia: string // 'daily' | 'weekly' | 'monthly'
  backupHora: string // HH:mm
  backupDiaSemana: number // 0-6 para weekly
  backupDiaMes: number // 1-31 para monthly
  backupRetencionDias: number
  backupStorageType: string // 'local' | 's3' | 'gcs'
  backupStoragePath: string
}

const DEFAULT_CONFIG: ConfiguracionSistema = {
  notificacionesEmail: true,
  notificacionesWhatsApp: false,
  notificacionesInApp: true,
  recordatorioTurnoHoras: 24,
  duracionTurnoDefault: 30,
  anticipacionMinimaHoras: 2,
  anticipacionMaximaDias: 90,
  permitirCancelacionOnline: true,
  horasCancelacionMinimas: 2,
  emailFrom: process.env.EMAIL_FROM || "noreply@agendaprofesional.com",
  emailFromName: process.env.EMAIL_FROM_NAME || "Agenda Profesional",
  emailSmtpHost: process.env.SMTP_HOST || "",
  emailSmtpPort: parseInt(process.env.SMTP_PORT || "587"),
  emailSmtpUser: process.env.SMTP_USER || "",
  emailSmtpPassword: process.env.SMTP_PASSWORD || "",
  emailSmtpSecure: process.env.SMTP_SECURE === "true",
  whatsappEnabled: false,
  whatsappProvider: "twilio",
  whatsappAccountSid: process.env.WHATSAPP_ACCOUNT_SID || "",
  whatsappAuthToken: process.env.WHATSAPP_AUTH_TOKEN || "",
  whatsappPhoneNumber: process.env.WHATSAPP_PHONE_NUMBER || "",
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecial: false,
  sessionTimeoutMinutes: 480,
  maxLoginAttempts: 5,
  backupAutomatico: false,
  backupFrecuencia: "daily",
  backupHora: "02:00",
  backupDiaSemana: 0,
  backupDiaMes: 1,
  backupRetencionDias: 30,
  backupStorageType: "local",
  backupStoragePath: process.env.BACKUP_STORAGE_PATH || "./backups",
}

/**
 * Obtener configuración del sistema
 */
export async function getConfiguracion(): Promise<ConfiguracionSistema> {
  try {
    // Intentar obtener de la base de datos
    const config = await prisma.$queryRawUnsafe<Array<{
      clave: string
      valor: string
    }>>(`SELECT clave, valor FROM ConfiguracionSistema`)

    if (config.length === 0) {
      return DEFAULT_CONFIG
    }

    // Convertir array de clave-valor a objeto
    const configObj: any = { ...DEFAULT_CONFIG }
    config.forEach((item) => {
      try {
        const parsed = JSON.parse(item.valor)
        configObj[item.clave] = parsed
      } catch {
        configObj[item.clave] = item.valor
      }
    })

    return configObj as ConfiguracionSistema
  } catch (error) {
    // Si la tabla no existe, retornar defaults
    console.error("Error obteniendo configuración:", error)
    return DEFAULT_CONFIG
  }
}

/**
 * Guardar configuración del sistema
 */
export async function saveConfiguracion(
  config: Partial<ConfiguracionSistema>
): Promise<void> {
  try {
    // Crear tabla si no existe
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ConfiguracionSistema (
        clave TEXT PRIMARY KEY,
        valor TEXT NOT NULL,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Guardar cada clave-valor
    for (const [key, value] of Object.entries(config)) {
      const valorStr = typeof value === 'object' ? JSON.stringify(value) : String(value)
      await prisma.$executeRawUnsafe(
        `INSERT OR REPLACE INTO ConfiguracionSistema (clave, valor, updatedAt) 
         VALUES (?, ?, CURRENT_TIMESTAMP)`,
        key,
        valorStr
      )
    }
  } catch (error) {
    console.error("Error guardando configuración:", error)
    throw error
  }
}
