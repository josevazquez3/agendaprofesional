"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, CheckCircle, XCircle, AlertCircle, ExternalLink, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GmailSmtpConfigProps {
  config: {
    emailFrom: string
    emailFromName: string
    emailSmtpHost: string
    emailSmtpPort: number
    emailSmtpUser: string
    emailSmtpPassword: string
    emailSmtpSecure: boolean
  }
  onConfigChange: (field: string, value: any) => void
}

/**
 * Componente de configuración SMTP específico para Gmail
 * 
 * IMPORTANTE PARA GMAIL:
 * 1. El usuario debe tener activada la verificación en 2 pasos en su cuenta de Google
 * 2. Debe generar una App Password (Contraseña de aplicación) en:
 *    https://myaccount.google.com/apppasswords
 * 3. La App Password es una contraseña de 16 caracteres que se usa en lugar de la contraseña normal
 * 4. Esta contraseña de aplicación es la que se debe guardar en el sistema, NO la contraseña normal de Gmail
 * 
 * Parámetros SMTP de Gmail:
 * - Host: smtp.gmail.com
 * - Puerto: 587
 * - Seguridad: TLS habilitado
 */
export function GmailSmtpConfig({ config, onConfigChange }: GmailSmtpConfigProps) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Detectar si el email es de Gmail
  const isGmail = config.emailFrom.toLowerCase().endsWith("@gmail.com") || 
                  config.emailFrom.toLowerCase().endsWith("@googlemail.com")

  // Auto-completar configuración Gmail cuando se detecta un email de Gmail
  const handleEmailChange = (value: string) => {
    onConfigChange("emailFrom", value)
    
    const emailLower = value.toLowerCase()
    const isGmailEmail = emailLower.endsWith("@gmail.com") || emailLower.endsWith("@googlemail.com")
    
    if (isGmailEmail) {
      // Auto-completar configuración Gmail
      onConfigChange("emailSmtpHost", "smtp.gmail.com")
      onConfigChange("emailSmtpPort", 587)
      onConfigChange("emailSmtpSecure", true)
      onConfigChange("emailSmtpUser", value) // Usar el mismo email como usuario
      setErrors({}) // Limpiar errores
    }
  }

  // Validar formato de email Gmail
  const validateGmailEmail = (email: string): boolean => {
    if (!email) return false
    const emailLower = email.toLowerCase()
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|googlemail)\.com$/
    return gmailRegex.test(emailLower)
  }

  // Validar contraseña de aplicación (16 caracteres)
  const validateAppPassword = (password: string): boolean => {
    // La App Password de Gmail tiene exactamente 16 caracteres (sin espacios)
    const cleanPassword = password.replace(/\s/g, "")
    return cleanPassword.length === 16
  }

  // Validar campos antes de probar
  const validateFields = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!config.emailFrom) {
      newErrors.emailFrom = "El email es requerido"
    } else if (isGmail && !validateGmailEmail(config.emailFrom)) {
      newErrors.emailFrom = "Debe ser un email válido de Gmail (@gmail.com o @googlemail.com)"
    }

    if (!config.emailFromName) {
      newErrors.emailFromName = "El nombre del remitente es requerido"
    }

    if (isGmail) {
      if (!config.emailSmtpPassword) {
        newErrors.emailSmtpPassword = "La contraseña de aplicación es requerida"
      } else if (!validateAppPassword(config.emailSmtpPassword)) {
        newErrors.emailSmtpPassword = "La contraseña de aplicación debe tener exactamente 16 caracteres (sin espacios)"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Probar conexión SMTP
  const handleTestConnection = async () => {
    if (!validateFields()) {
      setTestResult({
        success: false,
        message: "Por favor, complete todos los campos correctamente"
      })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/configuracion/test-smtp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailFrom: config.emailFrom,
          emailFromName: config.emailFromName,
          emailSmtpHost: config.emailSmtpHost,
          emailSmtpPort: config.emailSmtpPort,
          emailSmtpUser: config.emailSmtpUser,
          emailSmtpPassword: config.emailSmtpPassword,
          emailSmtpSecure: config.emailSmtpSecure,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: "Conexión exitosa. Email de prueba enviado correctamente."
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || data.message || "Error al probar la conexión SMTP"
        })
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Error de conexión. Verifique su conexión a internet."
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Configuración SMTP Gmail
        </CardTitle>
        <CardDescription>
          Configura el envío de correos mediante Gmail SMTP. Se detectará automáticamente cuando uses un email de Gmail.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información sobre App Password */}
        {isGmail && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Importante para Gmail:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Debes tener activada la verificación en 2 pasos en tu cuenta de Google</li>
                <li>Genera una <strong>App Password</strong> (Contraseña de aplicación) de 16 caracteres en:{" "}
                  <a 
                    href="https://myaccount.google.com/apppasswords" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    myaccount.google.com/apppasswords
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Usa esa App Password aquí, <strong>NO</strong> tu contraseña normal de Gmail</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Email remitente */}
        <div>
          <Label htmlFor="gmailEmailFrom">
            Email remitente (Gmail) *
          </Label>
          <Input
            id="gmailEmailFrom"
            type="email"
            value={config.emailFrom}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="tu-email@gmail.com"
            className={errors.emailFrom ? "border-red-500" : ""}
          />
          {errors.emailFrom && (
            <p className="text-sm text-red-500 mt-1">{errors.emailFrom}</p>
          )}
          {isGmail && !errors.emailFrom && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Email de Gmail detectado. Configuración SMTP aplicada automáticamente.
            </p>
          )}
        </div>

        {/* Nombre del remitente */}
        <div>
          <Label htmlFor="gmailEmailFromName">
            Nombre del remitente *
          </Label>
          <Input
            id="gmailEmailFromName"
            value={config.emailFromName}
            onChange={(e) => onConfigChange("emailFromName", e.target.value)}
            placeholder="Agenda Profesional"
            className={errors.emailFromName ? "border-red-500" : ""}
          />
          {errors.emailFromName && (
            <p className="text-sm text-red-500 mt-1">{errors.emailFromName}</p>
          )}
        </div>

        {/* Contraseña de aplicación */}
        <div>
          <Label htmlFor="gmailAppPassword">
            Contraseña de aplicación (App Password) *
          </Label>
          <Input
            id="gmailAppPassword"
            type="password"
            value={config.emailSmtpPassword}
            onChange={(e) => {
              const value = e.target.value.replace(/\s/g, "") // Eliminar espacios
              onConfigChange("emailSmtpPassword", value)
              if (errors.emailSmtpPassword) {
                const newErrors = { ...errors }
                delete newErrors.emailSmtpPassword
                setErrors(newErrors)
              }
            }}
            placeholder="xxxx xxxx xxxx xxxx"
            maxLength={19} // 16 caracteres + 3 espacios opcionales
            className={errors.emailSmtpPassword ? "border-red-500" : ""}
          />
          {errors.emailSmtpPassword && (
            <p className="text-sm text-red-500 mt-1">{errors.emailSmtpPassword}</p>
          )}
          {!errors.emailSmtpPassword && config.emailSmtpPassword && validateAppPassword(config.emailSmtpPassword) && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Contraseña de aplicación válida (16 caracteres)
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            La App Password tiene 16 caracteres. Puedes ingresarla con o sin espacios.
          </p>
        </div>

        {/* Configuración SMTP (solo lectura cuando es Gmail) */}
        {isGmail && (
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700">Configuración SMTP (auto-completada):</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Host:</span>
                <span className="ml-2 font-mono">{config.emailSmtpHost || "smtp.gmail.com"}</span>
              </div>
              <div>
                <span className="text-gray-600">Puerto:</span>
                <span className="ml-2 font-mono">{config.emailSmtpPort || 587}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Seguridad:</span>
                <span className="ml-2 font-mono">{config.emailSmtpSecure ? "TLS" : "Sin seguridad"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Botón de prueba */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <Button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || !isGmail || !config.emailFrom || !config.emailSmtpPassword}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Probando conexión...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Probar conexión
              </>
            )}
          </Button>
          
          {testResult && (
            <div className={`flex items-center gap-2 ${testResult.success ? "text-green-600" : "text-red-600"}`}>
              {testResult.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Mensaje si no es Gmail */}
        {config.emailFrom && !isGmail && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Este formulario está optimizado para Gmail. Si usas otro proveedor, configura los parámetros SMTP manualmente en la sección de configuración general.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
